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
    [Authorize(Roles = "Admin,FrontDesk")] // Chỉ Lễ tân và Admin mới xem được danh sách khách (Mục 2.1)
    public class GuestsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GuestsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Guests
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GuestResponseDto>>> GetGuests()
        {
            return await _context.Guests
                .Select(g => new GuestResponseDto {
                    GuestId = g.GuestId,
                    FullName = g.FullName,
                    Nationality = g.Nationality,
                    Phone = g.Phone,
                    Email = g.Email,
                    IdNumber = g.IdNumber,
                    GuestType = g.GuestType
                }).ToListAsync();
        }

        // GET: api/Guests/5
        [HttpGet("{id}")]
        public async Task<ActionResult<GuestResponseDto>> GetGuest(Guid id)
        {
            var g = await _context.Guests.FindAsync(id);

            if (g == null) return NotFound();

            return new GuestResponseDto {
                GuestId = g.GuestId,
                FullName = g.FullName,
                Nationality = g.Nationality,
                Phone = g.Phone,
                Email = g.Email,
                IdNumber = g.IdNumber,
                GuestType = g.GuestType
            };
        }

        // POST: api/Guests
        [HttpPost]
        public async Task<ActionResult<GuestResponseDto>> PostGuest(GuestCreateDto dto)
        {
            var guest = new Guest {
                FullName = dto.FullName,
                IdNumber = dto.IdNumber,
                Email = dto.Email,
                Phone = dto.Phone,
                Nationality = dto.Nationality,
                GuestType = GuestType.Regular
            };

            _context.Guests.Add(guest);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetGuest", new { id = guest.GuestId }, new GuestResponseDto {
                GuestId = guest.GuestId,
                FullName = guest.FullName,
                Nationality = guest.Nationality,
                Phone = guest.Phone,
                Email = guest.Email,
                IdNumber = guest.IdNumber,
                GuestType = guest.GuestType
            });
        }

        // DELETE: api/Guests/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteGuest(Guid id)
        {
            var guest = await _context.Guests.FindAsync(id);
            if (guest == null) return NotFound();

            _context.Guests.Remove(guest);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
