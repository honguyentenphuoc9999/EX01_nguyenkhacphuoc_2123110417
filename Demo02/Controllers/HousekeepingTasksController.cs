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
        public async Task<ActionResult<IEnumerable<HousekeepingTask>>> GetHousekeepingTasks([FromQuery] HmsTaskType? type = null, [FromQuery] bool excludeImages = false)
        {
            var fortyEightHoursAgo = DateTime.Now.AddHours(-48);
            var query = _context.HousekeepingTasks
                .AsNoTracking() // 🚀 Tăng tốc độ đọc dữ liệu
                .Include(t => t.Room!)
                    .ThenInclude(r => r.RoomType)
                .Include(t => t.AssignedStaff)
                .Where(t => t.Status != HmsTaskStatus.Completed || t.CreatedAt >= fortyEightHoursAgo);

            if (type.HasValue)
            {
                query = query.Where(t => t.TaskType == type.Value);
            }

            var finalQuery = query.OrderByDescending(t => t.ScheduledDate);

            if (excludeImages)
            {
                // 🔥 HMS SPEED: Load Metadata first + Count images
                return await finalQuery.Select(t => new HousekeepingTask {
                    TaskId = t.TaskId, RoomId = t.RoomId, Room = t.Room,
                    AssignedStaffId = t.AssignedStaffId, AssignedStaff = t.AssignedStaff,
                    Status = t.Status, TaskType = t.TaskType,
                    Notes = t.Notes, CreatedAt = t.CreatedAt, UpdatedAt = t.UpdatedAt,
                    CompletedAt = t.CompletedAt,
                    ProofPhotoUrl = null,
                    // Tính số lượng ảnh: Nếu string có dữ liệu thì coi như có ảnh (Frontend sẽ parse chính xác sau)
                    ProofPhotoCount = (t.ProofPhotoUrl != null && t.ProofPhotoUrl.Length > 5) ? 1 : 0 
                }).ToListAsync();
            }

            return await finalQuery.ToListAsync();
        }

        [HttpGet("staff")]
        public async Task<ActionResult<IEnumerable<object>>> GetHousekeepingStaff()
        {
            // 🚀 HMS SMART JOIN: Lấy nhân viên rảnh chỉ bằng 1 câu truy vấn duy nhất
            return await _context.Staffs
                .AsNoTracking()
                .Where(s => s.Role == StaffRole.Housekeeper && !s.IsDeleted)
                .Where(s => !_context.HousekeepingTasks.Any(t => t.Status == HmsTaskStatus.InProgress && t.AssignedStaffId == s.StaffId))
                .Select(s => new { s.StaffId, Name = s.FullName, s.Position })
                .ToListAsync();
        }

        [HttpGet("{id}/images")]
        public async Task<ActionResult<object>> GetTaskImages(Guid id)
        {
            var task = await _context.HousekeepingTasks.FindAsync(id);
            if (task == null) return NotFound();
            return new { proofPhotoUrl = task.ProofPhotoUrl };
        }

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

            // --- HMS Business Rule: Một nhân viên không thể dọn 2 phòng cùng lúc ---
            if (task.AssignedStaffId.HasValue && task.Status == HmsTaskStatus.InProgress)
            {
                var isBusy = await _context.HousekeepingTasks
                    .AnyAsync(t => t.TaskId != id && 
                                  t.AssignedStaffId == task.AssignedStaffId && 
                                  t.Status == HmsTaskStatus.InProgress);
                
                if (isBusy) return BadRequest("Nhân viên này đang bận dọn dẹp tại một phòng khác!");
            }

            // Cập nhật các trường cần thiết
            existingTask.Status = task.Status;
            existingTask.Notes = task.Notes;
            existingTask.CompletedAt = task.CompletedAt;
            existingTask.AssignedStaffId = task.AssignedStaffId;
            existingTask.ProofPhotoUrl = task.ProofPhotoUrl; // Cập nhật link ảnh chụp từ nhân viên

            // --- HMS Automation: Đồng bộ trạng thái phòng và nhiệm vụ ---
            var room = await _context.Rooms.FindAsync(existingTask.RoomId);
            if (room != null)
            {
                if (existingTask.Status == HmsTaskStatus.Completed)
                {
                    room.Status = RoomStatus.VacantClean; // Dọn xong -> Sạch
                }
                else if (existingTask.Status == HmsTaskStatus.InProgress || existingTask.Status == HmsTaskStatus.Pending)
                {
                    // Nếu đang dọn hoặc chờ dọn mà phòng lại đang hiện "Trống Sạch" -> Phải đưa về "Chưa dọn"
                    if (room.Status == RoomStatus.VacantClean)
                    {
                        room.Status = RoomStatus.VacantDirty;
                    }
                }
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
