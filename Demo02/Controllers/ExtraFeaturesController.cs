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
    public class MinibarLogsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public MinibarLogsController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MinibarLog>>> GetMinibarLogs() => await _context.MinibarLogs.Include(l=>l.Room).Include(l=>l.Item).ToListAsync();

        [HttpPost]
        public async Task<ActionResult<MinibarLog>> PostMinibarLog(MinibarLog log)
        {
            _context.MinibarLogs.Add(log);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetMinibarLogs", new { id = log.LogId }, log);
        }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class LoyaltyAccountsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public LoyaltyAccountsController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LoyaltyAccount>>> GetLoyaltyAccounts() => await _context.LoyaltyAccounts.Include(a=>a.Guest).ToListAsync();

        [HttpPost]
        public async Task<ActionResult<LoyaltyAccount>> PostLoyaltyAccount(LoyaltyAccount acc)
        {
            _context.LoyaltyAccounts.Add(acc);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetLoyaltyAccounts", new { id = acc.AccountId }, acc);
        }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class RefundsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public RefundsController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Refund>>> GetRefunds() => await _context.Refunds.ToListAsync();

        [HttpPost]
        public async Task<ActionResult<Refund>> PostRefund(Refund refund)
        {
            _context.Refunds.Add(refund);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetRefunds", new { id = refund.RefundId }, refund);
        }
    }
}
