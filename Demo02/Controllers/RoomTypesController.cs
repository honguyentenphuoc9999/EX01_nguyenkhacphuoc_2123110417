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
            var vnToday = DateTime.UtcNow.AddHours(7).Date;
            var cin = checkIn ?? vnToday;
            var cout = checkOut ?? vnToday.AddDays(1);

            // 1. Lấy danh sách Record Reservation khớp ngày
            var overlappingReservations = await _context.ReservationRooms
                .Include(rr => rr.Reservation)
                .Where(rr => rr.Reservation != null && 
                             rr.Reservation.Status != ReservationStatus.Cancelled &&
                             rr.Reservation.Status != ReservationStatus.CheckedOut &&
                             rr.Reservation.CheckInDate.Date < cout.Date && 
                             rr.Reservation.CheckOutDate.Date > cin.Date)
                .ToListAsync();

            // 2. Lấy danh sách hạng phòng
            var roomTypes = await _context.RoomTypes
                .Include(rt => rt.Rooms)
                .ToListAsync();

            // 3. Tính toán kết quả
            var result = roomTypes.Select(rt => {
                var allRooms = rt.Rooms?.ToList() ?? new List<Room>();
                var totalRoomsCount = allRooms.Count;
                
                // Số phòng đã bị chiếm dụng (Reserved/Occupied)
                var bookedCount = overlappingReservations.Count(rr => rr.RoomTypeId == rt.RoomTypeId);
                
                int finalAvailable = totalRoomsCount - bookedCount;
                
                // --- HMS LOGIC: Nếu đặt hôm nay, chỉ loại trừ những phòng đang hỏng (OutOfOrder) ---
                if (cin.Date == vnToday)
                {
                    int maintenanceCount = allRooms.Count(r => 
                        r.Status == RoomStatus.OutOfOrder || 
                        r.Status == RoomStatus.UnderMaintenance);
                    
                    // Số lượng khả dụng thực tế không thể vượt quá (Tổng - hỏng)
                    finalAvailable = Math.Min(finalAvailable, totalRoomsCount - maintenanceCount);
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
