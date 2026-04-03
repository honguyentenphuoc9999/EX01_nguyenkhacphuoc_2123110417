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
            var startOfMonth = new DateTime(today.Year, today.Month, 1);

            // 1. Thống kê số lượng phòng thực tế
            var rooms = await _context.Rooms.ToListAsync();
            var totalRooms = rooms.Count;
            var vacantRooms = rooms.Count(r => r.Status == RoomStatus.VacantClean);
            var occupiedRooms = rooms.Count(r => r.Status == RoomStatus.Occupied);

            // 2. Tính toán doanh thu thực tế từ bảng Hóa đơn (Invoices)
            // Lấy tổng tiền của các hóa đơn đã thanh toán trong tháng này
            var monthlyRevenue = await _context.Invoices
                .Where(i => i.CreatedAt >= startOfMonth)
                .SumAsync(i => i.TotalAmount);

            return Ok(new
            {
                TotalRooms = totalRooms,
                VacantRooms = vacantRooms,
                OccupiedRooms = occupiedRooms,
                MonthlyRevenue = monthlyRevenue
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
