using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Demo02.Data;
using Demo02.Models;
using Demo02.Models.DTOs;

namespace Demo02.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Manager,Receptionist,Guest")] // Cho phép cả Khách hàng và Nhân viên thực hiện các tác vụ liên quan đến hồ sơ cá nhận
    public class GuestPortalController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GuestPortalController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Lấy thông tin hồ sơ của Khách hiện tại
        [HttpGet("profile")]
        public async Task<ActionResult<object>> GetMyProfile()
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(userEmail)) return Unauthorized("Email claim missing");

            // Tìm khách hàng (An toàn với Null và không phân biệt hoa thường)
            var guest = await _context.Guests
                .FirstOrDefaultAsync(g => g.Email != null && g.Email.ToLower() == userEmail.ToLower() && !g.IsDeleted);

            if (guest == null) return NotFound($"Guest with email {userEmail} not found in profile table.");

            var loyalty = await _context.LoyaltyAccounts
                .FirstOrDefaultAsync(l => l.GuestId == guest.GuestId && !l.IsDeleted);

            var documents = await _context.GuestDocuments.Where(d => d.GuestId == guest.GuestId).ToListAsync();

            return Ok(new
            {
                guest.FullName,
                guest.Email,
                guest.Phone,
                guest.Nationality,
                guest.GuestType,
                guest.Preferences,
                guest.IsVerified,
                LoyaltyPoints = loyalty?.CurrentPoints ?? 0,
                MembershipLevel = loyalty != null ? loyalty.Tier.ToString() : "Silver"
            });
        }

        // 2. Lấy danh sách lượt đặt phòng của tôi
        [HttpGet("reservations")]
        public async Task<ActionResult<IEnumerable<object>>> GetMyReservations()
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(userEmail)) return Unauthorized();

            var guest = await _context.Guests
                .FirstOrDefaultAsync(g => g.Email != null && g.Email.ToLower() == userEmail.ToLower() && !g.IsDeleted);

            if (guest == null) return NotFound();

            var reservations = await _context.Reservations
                .Include(r => r.Room)
                .Where(r => r.GuestId == guest.GuestId && !r.IsDeleted)
                .OrderByDescending(r => r.CheckInDate)
                .Select(r => new
                {
                    r.ReservationId,
                    r.BookingCode,
                    r.CheckInDate,
                    r.CheckOutDate,
                    RoomId = r.RoomId,
                    RoomNumber = r.Room != null ? r.Room.RoomNumber : "N/A", // Xử lý nếu chưa gán phòng
                    r.Status,
                    r.CancellationReason,
                    TotalCharged = r.DepositAmount
                })
                .ToListAsync();

            return Ok(reservations);
        }

        // 3. Tải lên giấy tờ tùy thân (Document) theo BRD
        [HttpPost("documents")]
        public async Task<IActionResult> UploadDocument([FromBody] string documentUrl, [FromQuery] string type = "IDCard", [FromQuery] Guid? guestId = null)
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            
            Guest? guest = null;

            // Nếu là Nhân viên và có truyền guestId => Xác minh cho khách đó
            if (guestId.HasValue && (userRole == "Admin" || userRole == "Manager" || userRole == "Receptionist"))
            {
                guest = await _context.Guests.FindAsync(guestId.Value);
            }
            else
            {
                // Mặc định: Khách tự tải lên cho chính mình
                guest = await _context.Guests.FirstOrDefaultAsync(g => g.Email == userEmail);
            }

            if (guest == null) return NotFound("Hồ sơ khách hàng không tồn tại hoặc bạn không có quyền thực hiện.");

            var doc = new GuestDocument
            {
                GuestId = guest.GuestId,
                DocumentType = type,
                DocumentUrl = documentUrl,
                UploadedAt = DateTime.Now
            };

            _context.GuestDocuments.Add(doc);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Giấy tờ đã được tải lên và bảo mật thành công." });
        }
        // 4. Hủy đặt phòng (Theo yêu cầu: Kèm lý do)
        [HttpPost("reservations/{id}/cancel")]
        public async Task<IActionResult> CancelReservation(Guid id, [FromBody] string reason)
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            var guest = await _context.Guests.FirstOrDefaultAsync(g => g.Email == userEmail);
            if (guest == null) return NotFound();

            var reservation = await _context.Reservations
                .FirstOrDefaultAsync(r => r.ReservationId == id && r.GuestId == guest.GuestId);

            if (reservation == null) return NotFound("Không tìm thấy thông tin đặt phòng.");

            if (reservation.Status != ReservationStatus.Pending && reservation.Status != ReservationStatus.Confirmed)
                return BadRequest("Đặt phòng này không thể hủy (Có thể bạn đã nhận phòng hoặc đã thanh toán xong).");

            reservation.Status = ReservationStatus.Cancelled;
            reservation.CancellationReason = reason; // --- 🛡️ FIX: Lưu lý do vào bản ghi ---
            reservation.CancelledAt = DateTime.Now;
            reservation.UpdatedAt = DateTime.Now;
            
            // Lưu vết lý do hủy vào nhật ký hệ thống (Audit Logs) bằng cấu trúc bảng thực tế
            var log = new AuditLog
            {
                EntityName = "Reservation",
                EntityId = reservation.ReservationId.ToString(),
                Action = "Cancel",
                Changes = $"Hủy đặt phòng. Lý do: {reason}",
                UserId = userEmail ?? "Guest",
                Timestamp = DateTime.Now
            };
            _context.AuditLogs.Add(log);

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã hủy đặt phòng thành công." });
        }

        // 5. Cập nhật sở thích (TikTok Style Tags)
        [HttpPost("preferences")]
        public async Task<IActionResult> UpdatePreferences([FromBody] List<string> tags)
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            var guest = await _context.Guests.FirstOrDefaultAsync(g => g.Email == userEmail);
            if (guest == null) return NotFound();

            guest.Preferences = string.Join(", ", tags);
            guest.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã cập nhật sở thích thành công." });
        }

        // 6. Đặt phòng nhanh (Quick Booking)
        [HttpPost("quick-book")]
        public async Task<IActionResult> QuickBook([FromBody] QuickBookRequest request)
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(userEmail)) return Unauthorized();

            var guest = await _context.Guests.FirstOrDefaultAsync(g => g.Email != null && g.Email.ToLower() == userEmail.ToLower());
            if (guest == null) return NotFound("Hồ sơ khách hàng không đầy đủ.");

            var roomType = await _context.RoomTypes.FindAsync(request.RoomTypeId);
            if (roomType == null) return NotFound("Loại phòng không hợp lệ.");

            // --- HMS SMART AVAILABILITY: Tìm phòng thực sự rảnh trong khoảng thời gian này ---
            var allRoomsOfType = await _context.Rooms
                .Where(r => r.RoomTypeId == request.RoomTypeId && !r.IsDeleted)
                .ToListAsync();

            Room? availableRoom = null;
            foreach (var r in allRoomsOfType)
            {
                var isBusy = await _context.Reservations.AnyAsync(res => 
                    res.RoomId == r.RoomId && 
                    res.Status != ReservationStatus.Cancelled &&
                    ((request.CheckIn >= res.CheckInDate && request.CheckIn < res.CheckOutDate) || 
                     (request.CheckOut > res.CheckInDate && request.CheckOut <= res.CheckOutDate) ||
                     (request.CheckIn <= res.CheckInDate && request.CheckOut >= res.CheckOutDate)));
                
                if (!isBusy) {
                    availableRoom = r;
                    break;
                }
            }

            if (availableRoom == null) 
                return BadRequest("Rất tiếc, hiện tại hạng phòng này đã hết chỗ trong khoảng thời gian bạn chọn.");

            // 💎 HMS VIP LOGIC: Áp dụng giảm giá thực tế khi lưu vào DB
            var loyalty = await _context.LoyaltyAccounts.FirstOrDefaultAsync(l => l.GuestId == guest.GuestId && !l.IsDeleted);
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
            // 🛡️ CHỈ cập nhật Status nếu đây là đặt phòng cho HÔM NAY
            if (request.CheckIn.Date == DateTime.Today)
            {
                availableRoom.Status = RoomStatus.Reserved;
            }

            // 3. Tính toán 
            int nights = (int)(request.CheckOut - request.CheckIn).TotalDays;
            if (nights <= 0) nights = 1;

            decimal totalPrice = roomType.BasePrice * nights * discountMultiplier;

            var reservation = new Reservation
            {
                GuestId = guest.GuestId,
                RoomId = availableRoom.RoomId,
                BookingCode = "QB" + DateTime.Now.Ticks.ToString().Substring(10),
                CheckInDate = request.CheckIn,
                CheckOutDate = request.CheckOut,
                NumberOfGuests = request.NumberOfGuests,
                Status = ReservationStatus.Pending,
                TotalPrice = totalPrice, // 🛡️ Đã tính VIP discount ở trên
                CreatedAt = DateTime.Now
            };

            _context.Reservations.Add(reservation);
            
            // Tự động chuyển trạng thái phòng sang Reserved (Hoặc Occupied nếu cần)
            availableRoom.Status = RoomStatus.VacantClean; // Giữ trạng thái bận

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đặt phòng nhanh thành công! Hãy chờ email xác nhận.", bookingCode = reservation.BookingCode });
        }
    }

    public class QuickBookRequest
    {
        public Guid RoomTypeId { get; set; }
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public int NumberOfGuests { get; set; }
    }
}
