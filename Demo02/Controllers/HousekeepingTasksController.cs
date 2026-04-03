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
    public class HousekeepingTasksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HousekeepingTasksController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<HousekeepingTask>>> GetHousekeepingTasks() => await _context.HousekeepingTasks.Include(t=>t.Room).Include(t=>t.AssignedStaff).ToListAsync();

        [HttpGet("{id}")]
        public async Task<ActionResult<HousekeepingTask>> GetHousekeepingTask(Guid id)
        {
            var task = await _context.HousekeepingTasks.Include(t=>t.Room).Include(t=>t.AssignedStaff).FirstOrDefaultAsync(x=>x.TaskId == id);
            return task == null ? NotFound() : task;
        }

        [HttpPost]
        public async Task<ActionResult<HousekeepingTask>> PostHousekeepingTask(HousekeepingTask task)
        {
            _context.HousekeepingTasks.Add(task);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetHousekeepingTask", new { id = task.TaskId }, task);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutHousekeepingTask(Guid id, HousekeepingTask task)
        {
            if (id != task.TaskId) return BadRequest();
            
            var existingTask = await _context.HousekeepingTasks.FindAsync(id);
            if (existingTask == null) return NotFound();

            // Cập nhật các trường cần thiết
            existingTask.Status = task.Status;
            existingTask.Notes = task.Notes;
            existingTask.CompletedAt = task.CompletedAt;
            existingTask.AssignedStaffId = task.AssignedStaffId;

            // --- HMS Automation: Nếu dọn xong, biến phòng thành Trống Sạch ---
            if (existingTask.Status == HmsTaskStatus.Completed)
            {
                var room = await _context.Rooms.FindAsync(existingTask.RoomId);
                if (room != null) room.Status = RoomStatus.VacantClean;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHousekeepingTask(Guid id)
        {
            var task = await _context.HousekeepingTasks.FindAsync(id);
            if (task == null) return NotFound();
            _context.HousekeepingTasks.Remove(task);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
