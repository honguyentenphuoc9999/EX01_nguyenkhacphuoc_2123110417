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

            // 1. Lấy danh sách Record Reservation khớp ngày từ bảng ReservationRooms (Nguồn chuẩn Inventory)
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
                
                // --- HMS RIGID LOGIC: Ưu tiên vận hành thực tế ---
                if (cin.Date == vnToday)
                {
                    // Đếm số lượng phòng THỰC SỰ SẴN SÀNG (Trống + Sạch)
                    int readyRoomsCount = allRooms.Count(r => r.Status == RoomStatus.VacantClean);
                    
                    // Nếu đặt hôm nay, khách chỉ có thể đặt tối đa số phòng đã dọn xong
                    finalAvailable = Math.Min(finalAvailable, readyRoomsCount);
                }

                if (finalAvailable < 0) finalAvailable = 0;

                return new RoomTypeResponseDto {
                    RoomTypeId = rt.RoomTypeId,
                    TypeName = rt.TypeName,
                    BasePrice = rt.BasePrice,
                    Description = rt.Description,
                    MaxOccupancy = rt.MaxOccupancy,
                    RoomCount = totalRoomsCount,
                    AvailableRooms = finalAvailable,
                    ImageUrl = rt.ImageUrl                };
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
        public async Task<IActionResult> PutRoomType(Guid id, [FromBody] System.Text.Json.Nodes.JsonNode data)
        {
            var existing = await _context.RoomTypes.FindAsync(id);
            if (existing == null) return NotFound();

            // Cập nhật thông tin cơ bản
            existing.TypeName = (data["typeName"] ?? data["TypeName"])?.ToString() ?? existing.TypeName;
            existing.Description = (data["description"] ?? data["Description"])?.ToString() ?? existing.Description;
            
            if (data["basePrice"] != null || data["BasePrice"] != null)
                existing.BasePrice = decimal.Parse((data["basePrice"] ?? data["BasePrice"])!.ToString());
            
            if (data["maxOccupancy"] != null || data["MaxOccupancy"] != null)
                existing.MaxOccupancy = int.Parse((data["maxOccupancy"] ?? data["MaxOccupancy"])!.ToString());

            // Xử lý link ảnh - ÉP BUỘC LƯU
            var imgNode = data["imageUrl"] ?? data["ImageUrl"];
            if (imgNode != null)
            {
                string link = imgNode.ToString();
                if (!string.IsNullOrEmpty(link))
                {
                    existing.ImageUrl = link;
                    _context.Entry(existing).Property(x => x.ImageUrl).IsModified = true;
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RoomTypeExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        [HttpPost]
        public async Task<ActionResult<RoomType>> PostRoomType([FromBody] RoomType roomType)
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
