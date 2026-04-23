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
        public Guid? AssignedRoomId { get; set; }
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

        // --- MỚI: API KIỂM TRA PHÒNG CHI TIẾT THEO NGÀY ---
        [HttpGet("AvailableRoomsInType/{roomTypeId}")]
        public async Task<IActionResult> GetAvailableRoomsInType(Guid roomTypeId, [FromQuery] DateTime checkIn, [FromQuery] DateTime checkOut)
        {
            var vnNow = DateTime.UtcNow.AddHours(7);
            var today = vnNow.Date;

            var allRooms = await _context.Rooms
                .Where(r => r.RoomTypeId == roomTypeId && !r.IsDeleted)
                .Select(r => new { r.RoomId, r.RoomNumber, r.Status, r.ImageUrls })
                .ToListAsync();

            var result = new List<object>();

            foreach (var r in allRooms)
            {
                var isReserved = await _context.Reservations.AnyAsync(res => 
                    res.RoomId == r.RoomId && 
                    res.Status != ReservationStatus.Cancelled &&
                    res.Status != ReservationStatus.CheckedOut &&
                    res.CheckInDate.Date < checkOut.Date && 
                    res.CheckOutDate.Date > checkIn.Date);

                bool isAvailable = !isReserved;

                if (isAvailable && checkIn.Date == today)
                {
                    if (r.Status != RoomStatus.VacantClean) isAvailable = false;
                }

                result.Add(new {
                    roomId = r.RoomId,
                    roomNumber = r.RoomNumber,
                    imageUrls = r.ImageUrls,
                    isAvailable = isAvailable
                });
            }

            return Ok(result);
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

            // --- HMS SMART AVAILABILITY: Kiểm tra số lượng phòng trống thực tế ---
            var vnNow = DateTime.UtcNow.AddHours(7);
            var today = vnNow.Date;

            var totalRoomsInType = await _context.Rooms
                .CountAsync(r => r.RoomTypeId == dto.RoomTypeId && !r.IsDeleted);

            // Đếm số lượng đặt phòng đã được xác nhận sử dụng bảng ReservationRooms (Nguồn chuẩn cho Inventory)
            var bookedRoomsCount = await _context.ReservationRooms
                .Include(rr => rr.Reservation)
                .CountAsync(rr => rr.RoomTypeId == dto.RoomTypeId &&
                                 rr.Reservation != null &&
                                 rr.Reservation.Status != ReservationStatus.Cancelled &&
                                 rr.Reservation.Status != ReservationStatus.CheckedOut &&
                                 rr.Reservation.CheckInDate.Date < dto.CheckOutDate.Date && 
                                 rr.Reservation.CheckOutDate.Date > dto.CheckInDate.Date);

            if (bookedRoomsCount >= totalRoomsInType)
                return BadRequest(new { message = "Rất tiếc, hạng phòng này hiện đã kín chỗ trong khoảng thời gian bạn chọn. Vui lòng chọn ngày khác!" });

            // Lấy danh sách tất cả các phòng để tính toán (trước khi chia logic chọn hay không)
            var allRoomsOfType = await _context.Rooms
                .Where(r => r.RoomTypeId == dto.RoomTypeId && !r.IsDeleted)
                .ToListAsync();

            Room? targetRoom = null;

            // 1. Nếu khách hàng CHỌN TRƯỚC phòng cụ thể:
            if (dto.AssignedRoomId != null)
            {
                var specificRoom = await _context.Rooms.FindAsync(dto.AssignedRoomId);
                if (specificRoom != null && specificRoom.RoomTypeId == dto.RoomTypeId && !specificRoom.IsDeleted)
                {
                    // Kiểm tra xem phòng đó có lịch trùng lặp không
                    var isReserved = await _context.Reservations.AnyAsync(res => 
                        res.RoomId == specificRoom.RoomId && 
                        res.Status != ReservationStatus.Cancelled &&
                        res.Status != ReservationStatus.CheckedOut &&
                        res.CheckInDate.Date < dto.CheckOutDate.Date && 
                        res.CheckOutDate.Date > dto.CheckInDate.Date);

                    if (!isReserved)
                    {
                        if (dto.CheckInDate.Date == today && specificRoom.Status == RoomStatus.VacantClean)
                            targetRoom = specificRoom; // ok
                        else if (dto.CheckInDate.Date != today)
                            targetRoom = specificRoom; // ok
                    }
                }
                
                if (targetRoom == null)
                    return BadRequest(new { message = "Phòng bạn chọn hiện không sẵn sàng trong khoảng thời gian này hoặc đã có người đặt. Vui lòng chọn phòng khác!" });
            }
            else
            {
                // 2. Nếu khách không chọn phòng cụ thể, Tự động phân bổ
                foreach (var r in allRoomsOfType)
                {
                    var isReserved = await _context.Reservations.AnyAsync(res => 
                        res.RoomId == r.RoomId && 
                        res.Status != ReservationStatus.Cancelled &&
                        res.Status != ReservationStatus.CheckedOut &&
                        res.CheckInDate.Date < dto.CheckOutDate.Date && 
                        res.CheckOutDate.Date > dto.CheckInDate.Date);
                    
                    if (isReserved) continue;

                    if (dto.CheckInDate.Date == today)
                    {
                        if (r.Status != RoomStatus.VacantClean) continue;
                    }
                    
                    targetRoom = r;
                    break;
                }
            }

            if (targetRoom == null) 
            {
                if (dto.CheckInDate.Date == today)
                    return BadRequest(new { message = "Rất tiếc, hiện tại không có phòng nào đủ tiêu chuẩn 'Sạch & Sẵn sàng' để giao ngay. Vui lòng liên hệ Lễ tân hoặc chọn ngày khác!" });
                
                return BadRequest(new { message = "Hạng phòng này hiện chưa có phòng vật lý khả dụng để gán cho đơn đặt này!" });
            }

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
                    IdNumber = "PENDING-" + vnNow.ToString("HHmmss"),
                    Email = dto.Email, GuestType = GuestType.Regular,
                    CreatedAt = vnNow
                };
                _context.Guests.Add(guestProfile);
                await _context.SaveChangesAsync();
            }
            else if (!isStaffBooking)
            {
                // Nếu khách hàng ĐÃ ĐĂNG NHẬP và chính là chủ tài khoản này, không bắt check mật khẩu lại
                bool isOwnAccount = User.Identity?.IsAuthenticated == true && User.Identity.Name == user.UserName;
                
                if (!isOwnAccount)
                {
                    var signResult = await _signInManager.CheckPasswordSignInAsync(user, dto.Password ?? "", false);
                    if (!signResult.Succeeded) return BadRequest(new { message = "Mật khẩu không chính xác. Vui lòng thử lại!" });
                }
            }

            // --- ✍️ THỰC THI ĐẶT PHÒNG ---
            var guest = await _context.Guests.FirstOrDefaultAsync(g => g.Phone == dto.Phone);
            if (guest == null) {
                guest = new Guest { FullName = dto.FullName, Phone = dto.Phone, CreatedAt = vnNow };
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
                RoomId = targetRoom?.RoomId,
                BookingCode = "HMS-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper(),
                CheckInDate = dto.CheckInDate,
                CheckOutDate = dto.CheckOutDate,
                Status = ReservationStatus.Pending,
                TotalPrice = roomType.BasePrice * nights * discountMultiplier,
                CreatedAt = vnNow
            };

            // 🛡️ Cập nhật trạng thái phòng nếu đặt hôm nay
            if (targetRoom != null && dto.CheckInDate.Date <= today && dto.CheckOutDate.Date > today)
            {
                targetRoom.Status = RoomStatus.Reserved;
            }
            
            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync(); // Lưu để có ReservationId

            // --- 🔗 QUAN TRỌNG: Lưu vào ReservationRooms để đồng bộ logic tính phòng trống ---
            var resRoom = new ReservationRoom {
                ReservationId = reservation.ReservationId,
                RoomTypeId = dto.RoomTypeId,
                RoomId = targetRoom?.RoomId, 
                RoomRate = roomType.BasePrice * discountMultiplier // Sửa lỗi biên dịch ở đây
            };
            _context.ReservationRooms.Add(resRoom);
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
