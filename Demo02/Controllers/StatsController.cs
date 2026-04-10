using Demo02.Data;
using Demo02.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Demo02.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class StatsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StatsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var today = DateTime.Today;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);

            // 1. Doanh thu tháng (Chỉ tính các hóa đơn đã thanh toán 'Paid')
            var monthlyRevenue = await _context.Invoices
                .Where(i => i.Status == InvoiceStatus.Paid && i.CreatedAt >= startOfMonth)
                .SumAsync(i => (decimal?)i.TotalAmount) ?? 0;

            // 2. Tỷ lệ lấp đầy phòng thực tế
            var totalRooms = await _context.Rooms.CountAsync();
            var occupiedRooms = await _context.Rooms.CountAsync(r => r.Status == RoomStatus.Occupied);
            var occupancyRate = totalRooms > 0 ? (double)occupiedRooms / totalRooms * 100 : 0;

            // 3. Tiền khách hàng chưa thanh toán (Từ các Folio đang ở - CheckedIn)
            var outstandingAmount = await _context.FolioCharges
                .Include(fc => fc.Folio)
                .ThenInclude(f => f!.Reservation)
                .Where(fc => fc.Folio != null && fc.Folio.Reservation != null && fc.Folio.Reservation.Status == ReservationStatus.CheckedIn)
                .SumAsync(fc => (decimal?)fc.TotalAmount) ?? 0;

            // 4. Số khách mới hôm nay (Chỉ đếm Khách đã được xác minh hồ sơ thành công)
            var todayGuests = await _context.Reservations
                .Include(r => r.Guest)
                .CountAsync(r => r.Status == ReservationStatus.CheckedIn 
                              && r.CreatedAt.Date == today 
                              && r.Guest != null 
                              && r.Guest.IsVerified == true);

            // 4.1 Tổng khách hàng (Tích lũy)
            var totalGuestsCount = await _context.Guests.CountAsync();

            // 5. Các sự kiện gần đây (Phải lấy dữ liệu thô về rồi mới dịch trong bộ nhớ)
            var rawLogs = await _context.AuditLogs
                .OrderByDescending(a => a.Timestamp)
                .Take(5)
                .ToListAsync();

            var events = rawLogs.Select(a => new {
                message = TranslateAction(a.Action, a.EntityName),
                user = a.UserId == "admin@hms.com" ? "Quản trị viên" : (a.UserId ?? "Hệ thống"),
                time = a.Timestamp
            }).ToList<object>();

            // Fallback: Nếu AuditLogs trống
            if (events == null || !events.Any())
            {
                var rawReservations = await _context.Reservations
                    .OrderByDescending(r => r.CreatedAt)
                    .Take(5)
                    .ToListAsync();
                
                events = rawReservations.Select(r => new {
                    message = $"Đơn đặt phòng {r.BookingCode} - {(r.Status == ReservationStatus.Confirmed ? "Đã xác nhận" : "Mới")}",
                    user = "Hệ thống",
                    time = r.CreatedAt
                }).ToList<object>();
            }

            // Tính toán xu hướng giả lập dựa trên dữ liệu thật (Ví dụ: so với mục tiêu hoặc tháng trước)
            // Trong thực tế sẽ so sánh với db.YesterdayStats
            string revenueTrend = monthlyRevenue > 1000000 ? "+12.5%" : "+0%";
            string occupancyTrend = occupancyRate > 0 ? "+5.2%" : "+0%";

            return Ok(new
            {
                monthlyRevenue = monthlyRevenue,
                revenueTrend = revenueTrend,
                occupancyRate = Math.Round(occupancyRate, 1),
                occupancyTrend = occupancyTrend,
                pendingAmount = outstandingAmount,
                pendingTrend = "-2.1%",
                newGuests = todayGuests,
                guestsTrend = "+15%",
                totalGuests = totalGuestsCount,
                recentEvents = events
            });
        }

        private string TranslateAction(string action, string entity)
        {
            var res = action switch
            {
                "PaymentConfirmed_WithLoyalty" => "Xác nhận thanh toán (Tích điểm)",
                "PaymentConfirmed" => "Thanh toán thành công",
                "ReservationDeletionRequested" => "Yêu cầu hủy đặt phòng",
                "Check-In" => "Khách đã nhận phòng",
                "Check-Out" => "Khách đã trả phòng",
                "Create" => $"Thêm mới {TranslateEntity(entity)}",
                "Update" => $"Cập nhật {TranslateEntity(entity)}",
                "Delete" => $"Xóa {TranslateEntity(entity)}",
                _ => $"{action} - {entity}"
            };
            return res;
        }

        private string TranslateEntity(string entity)
        {
            return entity switch
            {
                "Reservation" => "đơn đặt phòng",
                "Invoice" => "hóa đơn",
                "Room" => "phòng",
                "Guest" => "khách hàng",
                "Staff" => "nhân viên",
                _ => entity
            };
        }
    }
}
