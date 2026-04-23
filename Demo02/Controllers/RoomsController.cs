using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Demo02.Data;
using Demo02.Models;
using Demo02.Models.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace Demo02.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Yêu cầu đăng nhập để xem/quản lý phòng (HMS NFR-06)
    public class RoomsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RoomsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Rooms
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoomResponseDto>>> GetRooms()
        {
            return await _context.Rooms
                .AsNoTracking()
                .Include(r => r.RoomType)
                .Select(r => new RoomResponseDto {
                    RoomId = r.RoomId,
                    RoomNumber = r.RoomNumber,
                    Floor = r.Floor,
                    RoomTypeName = r.RoomType!.TypeName,
                    Status = r.Status,
                    BasePrice = r.BasePrice,
                    ImageUrls = r.ImageUrls // Thêm ảnh Cloudinary
                }).ToListAsync();
        }

        public class RoomUpdateDto
        {
            public string? RoomNumber { get; set; }
            public string? roomNumber { get; set; }
            public int? Floor { get; set; }
            public int? floor { get; set; }
            public Guid? RoomTypeId { get; set; }
            public Guid? roomTypeId { get; set; }
            public int? Status { get; set; }
            public int? status { get; set; }
            public string? ImageUrls { get; set; }
            public string? imageUrls { get; set; }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutRoom(Guid id, [FromBody] RoomUpdateDto data)
        {
            var existing = await _context.Rooms.FindAsync(id);
            if (existing == null) return NotFound();

            string? num = data.RoomNumber ?? data.roomNumber;
            if (num != null) existing.RoomNumber = num;

            if (data.Floor.HasValue) existing.Floor = data.Floor.Value;
            else if (data.floor.HasValue) existing.Floor = data.floor.Value;

            if (data.RoomTypeId.HasValue) existing.RoomTypeId = data.RoomTypeId.Value;
            else if (data.roomTypeId.HasValue) existing.RoomTypeId = data.roomTypeId.Value;

            if (data.Status.HasValue) existing.Status = (RoomStatus)data.Status.Value;
            else if (data.status.HasValue) existing.Status = (RoomStatus)data.status.Value;

            // Xử lý link ảnh - ÉP BUỘC LƯU
            string? links = data.ImageUrls ?? data.imageUrls;
            if (links != null)
            {
                existing.ImageUrls = links;
                _context.Entry(existing).Property(x => x.ImageUrls).IsModified = true;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RoomExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        // GET: api/Rooms/5
        [HttpGet("{id}")]
        public async Task<ActionResult<RoomResponseDto>> GetRoom(Guid id)
        {
            var r = await _context.Rooms.Include(r => r.RoomType).FirstOrDefaultAsync(r => r.RoomId == id);

            if (r == null) return NotFound();

            return new RoomResponseDto {
                RoomId = r.RoomId,
                RoomNumber = r.RoomNumber,
                Floor = r.Floor,
                RoomTypeName = r.RoomType!.TypeName,
                Status = r.Status,
                BasePrice = r.BasePrice,
                ImageUrls = r.ImageUrls
            };
        }

        // POST: api/Rooms
        [HttpPost]
        [Authorize(Roles = "Admin")] // Chỉ Admin mới được tạo phòng (Mục 2.1)
        public async Task<ActionResult<RoomResponseDto>> PostRoom(RoomCreateDto dto)
        {
            var room = new Room {
                RoomNumber = dto.RoomNumber,
                Floor = dto.Floor,
                RoomTypeId = dto.RoomTypeId,
                BasePrice = dto.BasePrice,
                ImageUrls = dto.ImageUrls,
                Status = RoomStatus.VacantClean
            };

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetRoom", new { id = room.RoomId }, new RoomResponseDto {
                RoomId = room.RoomId,
                RoomNumber = room.RoomNumber,
                Floor = room.Floor,
                BasePrice = room.BasePrice,
                Status = room.Status
            });
        }

        // DELETE: api/Rooms/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteRoom(Guid id)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return NotFound();

            _context.Rooms.Remove(room); // Soft Delete tự động kích hoạt bởi AppDbContext
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
