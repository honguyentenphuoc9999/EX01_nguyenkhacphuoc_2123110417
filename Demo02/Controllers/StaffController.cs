using Demo02.Data.Repositories;
using Demo02.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Demo02.Controllers
{
    [Authorize(Roles = "Admin,Manager")]
    [ApiController]
    [Route("api/[controller]")]
    public class StaffController : ControllerBase
    {
        private readonly Demo02.Data.AppDbContext _context;

        public StaffController(Demo02.Data.AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var staff = await _context.Staffs.Where(s => !s.IsDeleted).ToListAsync();
            return Ok(staff);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var s = await _context.Staffs.FindAsync(id);
            if (s == null || s.IsDeleted) return NotFound();
            return Ok(s);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create(UpdateStaffDto dto)
        {
            var s = new Staff();
            s.EmployeeCode = "EMP-" + Guid.NewGuid().ToString().Substring(0, 6).ToUpper();
            s.FullName = dto.FullName;
            s.Email = dto.Email;
            s.Phone = dto.Phone;
            s.Role = (StaffRole)dto.Role;

            s.CreatedAt = DateTime.Now;
            s.CreatedBy = User.Identity?.Name ?? "System";
            
            _context.Staffs.Add(s);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = s.StaffId }, s);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStaffDto dto)
        {
            var existing = await _context.Staffs.FindAsync(id);
            if (existing == null) return NotFound();

            existing.FullName = dto.FullName;
            existing.Email = dto.Email;
            existing.Phone = dto.Phone;
            existing.Role = (StaffRole)dto.Role;

            existing.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DTO cục bộ với Validation nghiêm ngặt (BRD v3.0 compliant)
        public class UpdateStaffDto {
            [Required(ErrorMessage = "Họ và tên là bắt buộc")]
            [StringLength(200)]
            [RegularExpression(@"^[a-zA-ZÀ-ỹ\s]+$", ErrorMessage = "Tên nhân viên chỉ được chứa chữ.")]
            public string FullName { get; set; } = string.Empty;

            [Required(ErrorMessage = "Email là bắt buộc")]
            [EmailAddress(ErrorMessage = "Định dạng email không hợp lệ")]
            public string Email { get; set; } = string.Empty;

            [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
            [RegularExpression(@"^\d{10}$", ErrorMessage = "Số điện thoại phải bao gồm đúng 10 chữ số.")]
            public string Phone { get; set; } = string.Empty;

            [Required]
            [Range(0, 5, ErrorMessage = "Vai trò không hợp lệ")]
            public int Role { get; set; }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var s = await _context.Staffs.FindAsync(id);
            if (s == null) return NotFound();

            s.IsDeleted = true;
            s.DeletedAt = DateTime.Now;
            
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
