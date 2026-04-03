using Demo02.Data.Repositories;
using Demo02.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Demo02.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class StaffController : ControllerBase
    {
        private readonly IUnitOfWork _uow;
        private readonly ILogger<StaffController> _logger;

        public StaffController(IUnitOfWork uow, ILogger<StaffController> logger)
        {
            _uow = uow;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var staff = await _uow.Staffs.GetAllAsync();
            return Ok(staff);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var s = await _uow.Staffs.GetByIdAsync(id);
            if (s == null) return NotFound();
            return Ok(s);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Staff s)
        {
            if (string.IsNullOrEmpty(s.EmployeeCode))
            {
                s.EmployeeCode = "EMP-" + Guid.NewGuid().ToString().Substring(0, 6).ToUpper();
            }

            await _uow.Staffs.AddAsync(s);
            await _uow.CompleteAsync();
            return CreatedAtAction(nameof(GetById), new { id = s.StaffId }, s);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, Staff s)
        {
            var existing = await _uow.Staffs.GetByIdAsync(id);
            if (existing == null) return NotFound();

            existing.FullName = s.FullName;
            existing.Department = s.Department;
            existing.Position = s.Position;
            existing.Role = s.Role;
            existing.BaseSalary = s.BaseSalary;
            existing.UpdatedAt = DateTime.Now;

            await _uow.CompleteAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var s = await _uow.Staffs.GetByIdAsync(id);
            if (s == null) return NotFound();

            s.IsDeleted = true;
            s.DeletedAt = DateTime.Now;
            
            await _uow.CompleteAsync();
            return NoContent();
        }
    }
}
