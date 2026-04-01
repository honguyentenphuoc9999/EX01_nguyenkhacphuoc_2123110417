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
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetMaintenanceTicket", new { id = ticket.TicketId }, ticket);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMaintenanceTicket(Guid id, MaintenanceTicket ticket)
        {
            if (id != ticket.TicketId) return BadRequest();
            _context.Entry(ticket).State = EntityState.Modified;
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
