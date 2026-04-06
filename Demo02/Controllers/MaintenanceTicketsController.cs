using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Demo02.Data;
using Demo02.Models;

namespace Demo02.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MaintenanceTicketsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MaintenanceTicketsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaintenanceTicket>>> GetMaintenanceTickets() => await _context.MaintenanceTickets.Include(t=>t.Room).Include(t=>t.AssignedTechnician).ToListAsync();

        [HttpGet("{id}")]
        public async Task<ActionResult<MaintenanceTicket>> GetMaintenanceTicket(Guid id)
        {
            var ticket = await _context.MaintenanceTickets.Include(t=>t.Room).Include(t=>t.AssignedTechnician).FirstOrDefaultAsync(x=>x.TicketId == id);
            return ticket == null ? NotFound() : ticket;
        }

        [HttpPost]
        public async Task<ActionResult<MaintenanceTicket>> PostMaintenanceTicket(MaintenanceTicket ticket)
        {
            _context.MaintenanceTickets.Add(ticket);
            
            // HMS Rule (OPS-02): Tự động chuyển trạng thái phòng sang 'Maintenance' (Đang bảo trì)
            var room = await _context.Rooms.FindAsync(ticket.RoomId);
            if (room != null)
            {
                room.Status = RoomStatus.UnderMaintenance;
            }
            
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetMaintenanceTicket", new { id = ticket.TicketId }, ticket);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMaintenanceTicket(Guid id, MaintenanceTicket ticket)
        {
            if (id != ticket.TicketId) return BadRequest();
            _context.Entry(ticket).State = EntityState.Modified;
            
            // HMS Rule: Nếu đã sửa xong (Resolved), chuyển phòng sang trạng thái chờ dọn dẹp để buồng phòng vào làm việc
            if (ticket.Status == "Resolved")
            {
                var room = await _context.Rooms.FindAsync(ticket.RoomId);
                if (room != null)
                {
                    room.Status = RoomStatus.VacantDirty;
                }
            }
            
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaintenanceTicket(Guid id)
        {
            var ticket = await _context.MaintenanceTickets.FindAsync(id);
            if (ticket == null) return NotFound();
            _context.MaintenanceTickets.Remove(ticket);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
