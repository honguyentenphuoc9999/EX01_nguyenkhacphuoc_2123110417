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
    public class AuditLogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditLogsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/AuditLogs
        // UC-23: Xem lịch sử hệ thống (Audit Log)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetAuditLogs()
        {
            return await _context.AuditLogs
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();
        }

        // GET: api/AuditLogs/Entity/Room
        [HttpGet("Entity/{entityName}")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetLogsByEntity(string entityName)
        {
            return await _context.AuditLogs
                .Where(l => l.EntityName == entityName)
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();
        }
    }
}
