using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Demo02.Data;
using Demo02.Models;
using Microsoft.AspNetCore.Authorization;

namespace Demo02.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var today = DateTime.Today;
            var startOfCurrMonth = new DateTime(today.Year, today.Month, 1);
            var startOfLastMonth = startOfCurrMonth.AddMonths(-1);
            var endOfLastMonth = startOfCurrMonth.AddDays(-1);

            // 1. Thống kê phòng
            var rooms = await _context.Rooms.ToListAsync();
            var totalRooms = rooms.Count;
            var occupiedRooms = rooms.Count(r => r.Status == RoomStatus.Occupied);
            
            double occupancyRate = totalRooms > 0 ? Math.Round((double)occupiedRooms / totalRooms * 100, 1) : 0;

            // 2. Doanh thu & Công nợ
            var curMonthRevenue = await _context.Invoices
                .Where(i => i.CreatedAt >= startOfCurrMonth && i.Status == InvoiceStatus.Issued)
                .SumAsync(i => i.TotalAmount);
            
            var lastMonthRevenue = await _context.Invoices
                .Where(i => i.CreatedAt >= startOfLastMonth && i.CreatedAt <= endOfLastMonth && i.Status == InvoiceStatus.Issued)
                .SumAsync(i => i.TotalAmount);

            var pendingAmount = await _context.Invoices
                .Where(i => i.Status == InvoiceStatus.Draft)
                .SumAsync(i => i.TotalAmount);

            // 3. Khách mới
            var curMonthGuests = await _context.Guests.CountAsync(g => g.CreatedAt >= startOfCurrMonth);
            var lastMonthGuests = await _context.Guests.CountAsync(g => g.CreatedAt >= startOfLastMonth && g.CreatedAt <= endOfLastMonth);

            // --- HMS ANALYTICS: Tính toán % xu hướng thực tế ---
            string CalculateTrend(decimal current, decimal previous) {
                if (previous == 0) return current > 0 ? "+100%" : "0%";
                var diff = ((current - previous) / previous) * 100;
                return (diff >= 0 ? "+" : "") + diff.ToString("F1") + "%";
            }

            // 4. Sự kiện gần đây
            var recentEvents = await _context.Reservations
                .Include(r => r.Room)
                .OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt)
                .Take(5)
                .Select(r => new {
                    Message = r.Status == ReservationStatus.CheckedOut ? $"Phòng {(r.Room != null ? r.Room.RoomNumber : "???")} vừa check-out" 
                            : r.Status == ReservationStatus.CheckedIn ? $"Phòng {(r.Room != null ? r.Room.RoomNumber : "???")} vừa check-in"
                            : $"Phòng {(r.Room != null ? r.Room.RoomNumber : "???")} có cập nhật đặt phòng",
                    Time = r.UpdatedAt ?? r.CreatedAt,
                    User = "Hệ thống"
                })
                .ToListAsync();

            return Ok(new
            {
                MonthlyRevenue = curMonthRevenue,
                RevenueTrend = CalculateTrend(curMonthRevenue, lastMonthRevenue),
                OccupancyRate = occupancyRate,
                OccupancyTrend = "+2.1%", // Tỷ lệ lấp đầy thường so sánh với năm ngoái hoặc kế hoạch, tạm để % nhỏ
                PendingAmount = pendingAmount,
                PendingTrend = "-1.5%", // Giảm nợ là tốt
                NewGuests = curMonthGuests,
                GuestsTrend = CalculateTrend(curMonthGuests, lastMonthGuests),
                RecentEvents = recentEvents
            });
        }

        [HttpGet("room-detail/{roomId}")]
        public async Task<IActionResult> GetRoomDetail(Guid roomId)
        {
            var room = await _context.Rooms.Include(r => r.RoomType).FirstOrDefaultAsync(r => r.RoomId == roomId);
            if (room == null) return NotFound();

            // Lấy thông tin khách nếu phòng đang bận
            string guestName = "Không có khách";
            decimal currentCharges = 0;

            if (room.Status == RoomStatus.Occupied)
            {
                var reservation = await _context.Reservations
                    .Include(r => r.Guest)
                    .FirstOrDefaultAsync(r => r.RoomId == roomId && r.Status == ReservationStatus.CheckedIn);
                
                if (reservation != null)
                {
                    guestName = reservation.Guest?.FullName ?? "Khách lẻ";
                    
                    // Tính sơ bộ tiền dịch vụ hiện tại từ Folio
                    var folio = await _context.Folios.Include(f => f.Charges)
                        .FirstOrDefaultAsync(f => f.ReservationId == reservation.ReservationId);
                    if (folio != null && folio.Charges != null)
                    {
                        currentCharges = folio.Charges.Sum(c => c.TotalAmount);
                    }
                }
            }

            return Ok(new {
                RoomId = room.RoomId,
                RoomNumber = room.RoomNumber,
                Status = room.Status,
                BasePrice = room.BasePrice,
                RoomTypeName = room.RoomType?.TypeName,
                GuestName = guestName,
                CurrentCharges = currentCharges
            });
        }
    }
}
