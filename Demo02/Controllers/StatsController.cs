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

            // 4. Số khách mới hôm nay (Dựa trên ngày Check-In thực tế)
            var todayGuests = await _context.Reservations
                .CountAsync(r => r.Status == ReservationStatus.CheckedIn && r.CreatedAt.Date == today);

            return Ok(new
            {
                MonthlyRevenue = monthlyRevenue,
                OccupancyRate = Math.Round(occupancyRate, 1),
                OutstandingAmount = outstandingAmount,
                TodayGuests = todayGuests
            });
        }
    }
}
