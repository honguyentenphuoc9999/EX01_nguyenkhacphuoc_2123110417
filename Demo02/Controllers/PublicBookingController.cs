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

        // 1. Kiểm tra SĐT có tồn tại chưa để Frontend "biến hình" & Áp dụng Ưu đãi VIP
        [HttpGet("CheckAccount/{phone}")]
        public async Task<IActionResult> CheckAccount(string phone)
        {
            var identityUser = await _userManager.FindByNameAsync(phone) 
                             ?? await _userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phone);
            
            var guestProfile = await _context.Guests.FirstOrDefaultAsync(g => g.Phone == phone);
            
            // --- 💎 HMS VIP LOGIC ---
            var loyalty = guestProfile != null 
                ? await _context.LoyaltyAccounts.FirstOrDefaultAsync(l => l.GuestId == guestProfile.GuestId)
                : null;

            double discountRate = 0;
            string tierName = "None";

            if (loyalty != null)
            {
                tierName = loyalty.Tier.ToString();
                discountRate = loyalty.Tier switch
                {
                    LoyaltyTier.Royal => 0.25,
                    LoyaltyTier.Diamond => 0.20,
                    LoyaltyTier.Platinum => 0.15,
                    LoyaltyTier.Gold => 0.10,
                    LoyaltyTier.Silver => 0.05,
                    _ => 0
                };
            }

            return Ok(new { 
                exists = identityUser != null,
                hasProfile = guestProfile != null,
                fullName = guestProfile?.FullName,
                tier = tierName,
                discountRate = discountRate
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
                    isStaffBooking = true;
                }
            }

            if (string.IsNullOrWhiteSpace(dto.Phone) || dto.Phone.Length < 10)
                return BadRequest(new { message = "Số điện thoại không hợp lệ!" });

            var roomType = await _context.RoomTypes.FindAsync(dto.RoomTypeId);
            if (roomType == null) return NotFound(new { message = "Hạng phòng không tồn tại!" });

            // --- HMS SMART AVAILABILITY: Kiểm tra số lượng phòng trống của hạng này ---
            var totalRoomsInType = await _context.Rooms
                .CountAsync(r => r.RoomTypeId == dto.RoomTypeId && !r.IsDeleted);

            // Đếm số lượng đơn đặt phòng hạng này mà chưa bị hủy và trùng lịch
            var bookedRoomsCount = await _context.ReservationRooms
                .Include(rr => rr.Reservation)
                .CountAsync(rr => rr.RoomTypeId == dto.RoomTypeId &&
                             rr.Reservation != null &&
                             rr.Reservation.Status != ReservationStatus.Cancelled &&
                             rr.Reservation.CheckInDate < dto.CheckOutDate &&
                             rr.Reservation.CheckOutDate > dto.CheckInDate);

            if (bookedRoomsCount >= totalRoomsInType)
                return BadRequest(new { message = "Rất tiếc, hạng phòng này vừa hết phòng trong giây lát. Vui lòng chọn hạng khác hoặc ngày khác!" });

            // Tìm một phòng bất kỳ thuộc hạng này để gán vào đơn (Logic ưu tiên phòng trống thực tế)
            var allRoomsOfType = await _context.Rooms
                .Where(r => r.RoomTypeId == dto.RoomTypeId && !r.IsDeleted)
                .ToListAsync();

            Room? targetRoom = null;
            foreach (var r in allRoomsOfType)
            {
                var isOccupied = await _context.Reservations.AnyAsync(res => 
                    res.RoomId == r.RoomId && 
                    res.Status != ReservationStatus.Cancelled &&
                    res.CheckInDate < dto.CheckOutDate && 
                    res.CheckOutDate > dto.CheckInDate);
                
                if (!isOccupied) {
                    targetRoom = r;
                    break;
                }
            }

            // Nếu không tìm thấy phòng cụ thể để gán, vẫn cho đặt nhưng để RoomId = null (Lễ tân sẽ gán sau)
            // hoặc lấy phòng đầu tiên của hạng đó. Ở đây tôi sẽ lấy phòng đầu tiên nếu không tìm được phòng ưng ý.
            if (targetRoom == null) targetRoom = allRoomsOfType.FirstOrDefault();

            if (targetRoom == null) 
                return BadRequest(new { message = "Hạng phòng này hiện chưa có phòng vật lý nào được tạo!" });

            // --- ✍️ XỬ LÝ ĐĂNG KÝ / ĐĂNG NHẬP ---
            var user = await _userManager.FindByNameAsync(dto.Phone) 
                     ?? await _userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber == dto.Phone);
            
            if (user == null)
            {
                if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password != dto.ConfirmPassword)
                    return BadRequest(new { message = "Vui lòng nhập và xác nhận mật khẩu cho tài khoản mới của khách!" });

                user = new IdentityUser { UserName = dto.Phone, Email = dto.Email, EmailConfirmed = true, PhoneNumber = dto.Phone };
                var createResult = await _userManager.CreateAsync(user, dto.Password);
                if (!createResult.Succeeded) return BadRequest(new { message = "Không thể tạo tài khoản cho khách: " + createResult.Errors.FirstOrDefault()?.Description });
                
                await _userManager.AddToRoleAsync(user, "Guest");

                var guestProfile = new Guest {
                    FullName = dto.FullName, Phone = dto.Phone, Nationality = "Vietnam",
                    IdNumber = "PENDING-" + DateTime.Now.ToString("HHmmss"),
                    Email = dto.Email, GuestType = GuestType.Regular,
                    CreatedAt = DateTime.Now
                };
                _context.Guests.Add(guestProfile);
                await _context.SaveChangesAsync();
            }
            else if (!isStaffBooking)
            {
                var signResult = await _signInManager.CheckPasswordSignInAsync(user, dto.Password ?? "", false);
                if (!signResult.Succeeded) return BadRequest(new { message = "Mật khẩu không chính xác. Vui lòng thử lại!" });
            }

            // --- ✍️ THỰC THI ĐẶT PHÒNG ---
            var guest = await _context.Guests.FirstOrDefaultAsync(g => g.Phone == dto.Phone);
            if (guest == null) {
                guest = new Guest { FullName = dto.FullName, Phone = dto.Phone, CreatedAt = DateTime.Now };
                _context.Guests.Add(guest);
                await _context.SaveChangesAsync();
            }

            // 💎 TÍNH TOÁN GIÁ DỰA TRÊN HẠNG THÀNH VIÊN
            var loyalty = await _context.LoyaltyAccounts.FirstOrDefaultAsync(l => l.GuestId == guest.GuestId);
            decimal discountMultiplier = 1;
            if (loyalty != null)
            {
                decimal rate = loyalty.Tier switch {
                    LoyaltyTier.Royal => 0.25m,
                    LoyaltyTier.Diamond => 0.20m,
                    LoyaltyTier.Platinum => 0.15m,
                    LoyaltyTier.Gold => 0.10m,
                    LoyaltyTier.Silver => 0.05m,
                    _ => 0
                };
                discountMultiplier = 1 - rate;
            }

            int nights = (int)(dto.CheckOutDate - dto.CheckInDate).TotalDays;
            if (nights <= 0) nights = 1;

            var reservation = new Reservation {
                GuestId = guest.GuestId,
                RoomId = targetRoom.RoomId,
                BookingCode = "HMS-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper(),
                CheckInDate = dto.CheckInDate,
                CheckOutDate = dto.CheckOutDate,
                Status = ReservationStatus.Pending,
                TotalPrice = roomType.BasePrice * nights * discountMultiplier,
                CreatedAt = DateTime.Now
            };

            // 🛡️ CHỈ cập nhật Status nếu đây là đặt phòng cho HÔM NAY
            if (dto.CheckInDate.Date == DateTime.Today)
            {
                targetRoom.Status = RoomStatus.Reserved;
            }
            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();

            if (!isStaffBooking)
            {
                await _signInManager.SignInAsync(user, isPersistent: true);
                return Ok(new { 
                    message = "Đặt phòng thành công!", 
                    bookingCode = reservation.BookingCode,
                    totalPrice = reservation.TotalPrice,
                    redirect = "/guest-portal" 
                });
            }

            return Ok(new { 
                message = "Hỗ trợ đặt phòng cho khách thành công! (Quyền Quản trị)", 
                bookingCode = reservation.BookingCode,
                totalPrice = reservation.TotalPrice,
                fullName = guest.FullName,
                redirect = "/dashboard" 
            });
        }
    }
}
