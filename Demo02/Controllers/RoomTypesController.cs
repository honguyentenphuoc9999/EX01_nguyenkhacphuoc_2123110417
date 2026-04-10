using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Demo02.Data;
using Demo02.Models;
using Demo02.Models.DTOs;

namespace Demo02.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomTypesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RoomTypesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/RoomTypes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoomTypeResponseDto>>> GetRoomTypes([FromQuery] DateTime? checkIn, [FromQuery] DateTime? checkOut)
        {
            var cin = checkIn ?? DateTime.Today;
            var cout = checkOut ?? DateTime.Today.AddDays(1);

            // 1. Lấy tất cả các hạng phòng
            var roomTypes = await _context.RoomTypes
                .Include(rt => rt.Rooms)
                .ToListAsync();

            // 2. Tìm tất cả các ReservationRoom của các đơn đặt phòng trùng lịch (CheckIn < cout AND CheckOut > cin)
            // Lọc ra các đơn không bị hủy (Status != Cancelled)
            var overlappingReservations = await _context.ReservationRooms
                .Include(rr => rr.Reservation)
                .Where(rr => rr.Reservation != null && 
                             rr.Reservation.Status != ReservationStatus.Cancelled &&
                             rr.Reservation.CheckInDate < cout && 
                             rr.Reservation.CheckOutDate > cin)
                .ToListAsync();

            // 3. Tính toán kết quả
            var result = roomTypes.Select(rt => {
                var allRooms = rt.Rooms?.ToList() ?? new List<Room>();
                var totalRoomsCount = allRooms.Count;
                
                // Số phòng đã bị đặt trước (Reserved)
                var bookedCount = overlappingReservations.Count(rr => rr.RoomTypeId == rt.RoomTypeId);
                
                // Nếu khách đặt cho NGÀY HÔM NAY, phải kiểm tra trạng thái vật lý của phòng
                int unavailableCurrentStatus = 0;
                if (cin.Date == DateTime.Today)
                {
                    // Đếm những phòng không sẵn sàng: Đang bẩn (Dirty), Đang dọn (Cleaning), hoặc đang có khách (Occupied)
                    // và quan trọng là phòng đó CHƯA nằm trong danh sách đã bị đặt (bookedCount) để tránh trừ 2 lần
                    unavailableCurrentStatus = allRooms.Count(r => 
                        (r.Status == RoomStatus.Occupied || 
                         r.Status == RoomStatus.Dirty || 
                         r.Status == RoomStatus.Cleaning || 
                         r.Status == RoomStatus.Maintenance));

                    // Tuy nhiên, vì bookedCount đã đếm dựa trên Reservation, 
                    // ta chỉ cần lấy số lượng phòng THỰC SỰ SẠCH VÀ TRỐNG tại thời điểm này
                    // nếu nó ít hơn số phòng trống dự tính (total - booked)
                }

                int finalAvailable = totalRoomsCount - bookedCount;
                
                // Nếu đặt hôm nay, con số không thể vượt quá số phòng VacantClean hiện có
                if (cin.Date == DateTime.Today)
                {
                    int vacantCleanCount = allRooms.Count(r => r.Status == RoomStatus.VacantClean);
                    // Số phòng sẵn sàng = giá trị nhỏ nhất giữa (Tổng - Đã đặt) và (Số phòng đang Sạch)
                    finalAvailable = Math.Min(finalAvailable, vacantCleanCount);
                }

                if (finalAvailable < 0) finalAvailable = 0;

                return new RoomTypeResponseDto {
                    RoomTypeId = rt.RoomTypeId,
                    TypeName = rt.TypeName,
                    BasePrice = rt.BasePrice,
                    Description = rt.Description,
                    MaxOccupancy = rt.MaxOccupancy,
                    RoomCount = totalRoomsCount,
                    AvailableRooms = finalAvailable 
                };
            });

            return Ok(result);
        }

        // GET: api/RoomTypes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<RoomType>> GetRoomType(Guid id)
        {
            var roomType = await _context.RoomTypes.FindAsync(id);

            if (roomType == null)
            {
                return NotFound();
            }

            return roomType;
        }

        // PUT: api/RoomTypes/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRoomType(Guid id, RoomType roomType)
        {
            if (id != roomType.RoomTypeId)
            {
                return BadRequest();
            }

            _context.Entry(roomType).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RoomTypeExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/RoomTypes
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<RoomType>> PostRoomType(RoomType roomType)
        {
            _context.RoomTypes.Add(roomType);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetRoomType", new { id = roomType.RoomTypeId }, roomType);
        }

        // DELETE: api/RoomTypes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoomType(Guid id)
        {
            var roomType = await _context.RoomTypes.FindAsync(id);
            if (roomType == null)
            {
                return NotFound();
            }

            _context.RoomTypes.Remove(roomType);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool RoomTypeExists(Guid id)
        {
            return _context.RoomTypes.Any(e => e.RoomTypeId == id);
        }
    }
}
