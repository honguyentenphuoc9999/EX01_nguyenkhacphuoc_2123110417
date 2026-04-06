using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Demo02.Data;
using Demo02.Models;
using Demo02.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Demo02.Controllers
{
    public class PublicBookingRequestDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public Guid RoomTypeId { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public string Email { get; set; } = string.Empty;
        public int GuestCount { get; set; }
        
        // --- 🔐 SECURITY ADDITIONS ---
        public string? Password { get; set; }
        public string? ConfirmPassword { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class PublicBookingController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;

        public PublicBookingController(AppDbContext context, UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager)
        {
            _context = context;
            _userManager = userManager;
            _signInManager = signInManager;
        }

        // 1. Kiểm tra SĐT có tồn tại chưa để Frontend "biến hình"
        [HttpGet("CheckAccount/{phone}")]
        public async Task<IActionResult> CheckAccount(string phone)
        {
            // Tìm trong Identity: Thử theo Username HOẶC PhoneNumber (phòng trường hợp DB Seed dùng username khác)
            var identityUser = await _userManager.FindByNameAsync(phone) 
                             ?? await _userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phone);
            
            // Tìm trong Guests (Hồ sơ hành chính)
            var guestProfile = await _context.Guests.FirstOrDefaultAsync(g => g.Phone == phone);
            
            return Ok(new { 
                exists = identityUser != null, // Đã có tài khoản mật khẩu
                hasProfile = guestProfile != null, // Đã từng lưu hồ sơ (Nguyễn Thành Viên)
                fullName = guestProfile?.FullName // Tên để chào khách
            });
        }

        [HttpPost("Submit")]
        public async Task<IActionResult> SubmitBooking([FromBody] PublicBookingRequestDto dto)
        {
            // --- 🛡️ KIỂM TRA QUYỀN HẠN ---
            bool isStaffBooking = false;
            if (User.Identity?.IsAuthenticated == true)
            {
                if (User.IsInRole("Admin") || User.IsInRole("Staff") || User.IsInRole("Receptionist") || User.IsInRole("Manager"))
                {
                    isStaffBooking = true; // Đánh dấu đây là Admin đang đặt hộ khách
                }
            }

            // --- 🛡️ VALIDATE NGHIỆP VỤ ---
            if (string.IsNullOrWhiteSpace(dto.Phone) || dto.Phone.Length < 10)
                return BadRequest(new { message = "Số điện thoại không hợp lệ!" });

            var roomType = await _context.RoomTypes.FindAsync(dto.RoomTypeId);
            if (roomType == null) return NotFound(new { message = "Hạng phòng không tồn tại!" });

            var availableRoom = await _context.Rooms
                .FirstOrDefaultAsync(r => r.RoomTypeId == dto.RoomTypeId && r.Status == RoomStatus.VacantClean);
            if (availableRoom == null) return BadRequest(new { message = "Hạng phòng này tạm hết phòng sạch. Vui lòng chọn hạng phòng khác!" });

            // --- ✍️ XỬ LÝ ĐĂNG KÝ / ĐĂNG NHẬP ---
            var user = await _userManager.FindByNameAsync(dto.Phone) 
                     ?? await _userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber == dto.Phone);
            if (user == null)
            {
                // TRƯỜNG HỢP A: Người mới -> Bắt buộc nhập 2 mật khẩu
                if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password != dto.ConfirmPassword)
                    return BadRequest(new { message = "Vui lòng nhập và xác nhận mật khẩu cho tài khoản mới của khách!" });

                user = new IdentityUser { UserName = dto.Phone, Email = dto.Email, EmailConfirmed = true, PhoneNumber = dto.Phone };
                var createResult = await _userManager.CreateAsync(user, dto.Password);
                if (!createResult.Succeeded) return BadRequest(new { message = "Không thể tạo tài khoản cho khách: " + createResult.Errors.FirstOrDefault()?.Description });
                
                await _userManager.AddToRoleAsync(user, "Guest");

                // Tạo hồ sơ khách hàng ngay lập tức (Dùng user.Email thật)
                var guestProfile = new Guest {
                    FullName = dto.FullName, Phone = dto.Phone, Nationality = "Vietnam",
                    IdNumber = "PENDING-" + DateTime.Now.ToString("HHmmss"),
                    Email = dto.Email, GuestType = GuestType.Regular,
                    CreatedAt = DateTime.Now
                };
                _context.Guests.Add(guestProfile);
                await _context.SaveChangesAsync(); // 🛡️ Lưu ngay để tránh lỗi lặp ở bước sau
            }
            else if (!isStaffBooking)
            {
                // TRƯỜNG HỢP B: Người quen & KHÁCH tự đặt -> Xác thực mật khẩu
                var signResult = await _signInManager.CheckPasswordSignInAsync(user, dto.Password ?? "", false);
                if (!signResult.Succeeded) return BadRequest(new { message = "Mật khẩu không chính xác. Vui lòng thử lại!" });
            }

            // --- ✍️ THỰC THI ĐẶT PHÒNG ---
            var guest = await _context.Guests.FirstOrDefaultAsync(g => g.Phone == dto.Phone);
            if (guest == null) {
                guest = new Guest { FullName = dto.FullName, Phone = dto.Phone, CreatedAt = DateTime.Now };
                _context.Guests.Add(guest);
            }

            var reservation = new Reservation {
                GuestId = guest.GuestId,
                RoomId = availableRoom.RoomId,
                BookingCode = "HMS-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper(),
                CheckInDate = dto.CheckInDate,
                CheckOutDate = dto.CheckOutDate,
                Status = ReservationStatus.Pending,
                CreatedAt = DateTime.Now
            };

            availableRoom.Status = RoomStatus.Reserved;
            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();

            // Nếu là KHÁCH tự đặt -> Tự động đăng nhập. Nếu Admin đặt hộ -> Giữ nguyên phiên Admin.
            if (!isStaffBooking)
            {
                await _signInManager.SignInAsync(user, isPersistent: true);
                return Ok(new { 
                    message = "Đặt phòng thành công!", 
                    bookingCode = reservation.BookingCode,
                    redirect = "/guest-dashboard" 
                });
            }

            return Ok(new { 
                message = "Hỗ trợ đặt phòng cho khách thành công! (Quyền Quản trị)", 
                bookingCode = reservation.BookingCode,
                fullName = guest.FullName,
                redirect = "/reservations" // Admin quay về trang quản lý đặt phòng
            });
        }
    }
}
