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
                .Include(r => r.RoomType)
                .Select(r => new RoomResponseDto {
                    RoomId = r.RoomId,
                    RoomNumber = r.RoomNumber,
                    Floor = r.Floor,
                    RoomTypeName = r.RoomType!.TypeName,
                    Status = r.Status,
                    BasePrice = r.BasePrice
                }).ToListAsync();
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
                BasePrice = r.BasePrice
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
