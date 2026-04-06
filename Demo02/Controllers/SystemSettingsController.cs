using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Demo02.Data;
using Demo02.Models;
using Microsoft.AspNetCore.Authorization;

namespace Demo02.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Manager")]
    public class SystemSettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SystemSettingsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<SystemSettings>> GetSettings()
        {
            var settings = await _context.SystemSettings.FirstOrDefaultAsync();
            if (settings == null) return NotFound();
            return settings;
        }

        [HttpPut]
        public async Task<IActionResult> UpdateSettings(SystemSettings settings)
        {
            _context.Entry(settings).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.SystemSettings.Any(e => e.Id == settings.Id)) return NotFound();
                throw;
            }
            return NoContent();
        }
    }
}
