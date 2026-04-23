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
                    RoomTypeId = r.RoomTypeId,
                    Status = r.Status,
                    BasePrice = r.BasePrice,
                    ImageUrls = r.ImageUrls // Thêm ảnh Cloudinary
                }).ToListAsync();
        }

        public class RoomUpdateDto
        {
            public string? RoomNumber { get; set; }
            public int? Floor { get; set; }
            public Guid? RoomTypeId { get; set; }
            public int? Status { get; set; }
            public decimal? BasePrice { get; set; }
            public string? ImageUrls { get; set; }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutRoom(Guid id, [FromBody] RoomUpdateDto data)
        {
            var existing = await _context.Rooms.FindAsync(id);
            if (existing == null) return NotFound();

            if (data.RoomNumber != null && data.RoomNumber != existing.RoomNumber)
            {
                // Kiểm tra trùng số phòng với phòng khác
                if (await _context.Rooms.AnyAsync(r => r.RoomNumber == data.RoomNumber))
                    return BadRequest("Số phòng này đã tồn tại trong hệ thống.");
                existing.RoomNumber = data.RoomNumber;
            }
            if (data.Floor.HasValue) existing.Floor = data.Floor.Value;
            if (data.RoomTypeId.HasValue) existing.RoomTypeId = data.RoomTypeId.Value;
            if (data.Status.HasValue) existing.Status = (RoomStatus)data.Status.Value;
            if (data.BasePrice.HasValue) existing.BasePrice = data.BasePrice.Value;

            // Xử lý link ảnh - ÉP BUỘC LƯU
            if (data.ImageUrls != null)
            {
                existing.ImageUrls = data.ImageUrls;
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
                RoomTypeId = r.RoomTypeId,
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
            // Kiểm tra trùng số phòng trước khi tạo
            if (await _context.Rooms.AnyAsync(r => r.RoomNumber == dto.RoomNumber))
                return BadRequest("Số phòng này đã tồn tại trong hệ thống.");

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

            var roomType = await _context.RoomTypes.FindAsync(room.RoomTypeId);

            return CreatedAtAction("GetRoom", new { id = room.RoomId }, new RoomResponseDto {
                RoomId = room.RoomId,
                RoomNumber = room.RoomNumber,
                Floor = room.Floor,
                RoomTypeName = roomType?.TypeName ?? "",
                RoomTypeId = room.RoomTypeId,
                Status = room.Status,
                BasePrice = room.BasePrice,
                ImageUrls = room.ImageUrls
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

        private bool RoomExists(Guid id)
        {
            return _context.Rooms.Any(e => e.RoomId == id);
        }
    }
}
