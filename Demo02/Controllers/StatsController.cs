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

            // 5. Các sự kiện gần đây (Lấy từ Nhật ký hệ thống AuditLogs)
            var events = await _context.AuditLogs
                .OrderByDescending(a => a.Timestamp)
                .Take(5)
                .Select(a => new {
                    message = $"{a.Action} - {a.EntityName}",
                    user = a.UserId,
                    time = a.Timestamp
                })
                .ToListAsync<object>();

            // Fallback: Nếu AuditLogs trống, lấy 5 thông tin Đặt phòng gần nhất làm sự kiện
            if (events == null || events.Count == 0)
            {
                events = await _context.Reservations
                    .OrderByDescending(r => r.CreatedAt)
                    .Take(5)
                    .Select(r => new {
                        message = $"Booking {r.BookingCode} - {r.Status}",
                        user = "System",
                        time = r.CreatedAt
                    })
                    .ToListAsync<object>();
            }

            return Ok(new
            {
                monthlyRevenue = monthlyRevenue,
                occupancyRate = Math.Round(occupancyRate, 1),
                pendingAmount = outstandingAmount,
                newGuests = todayGuests,
                totalGuests = totalGuestsCount,
                recentEvents = events
            });
        }
    }
}
