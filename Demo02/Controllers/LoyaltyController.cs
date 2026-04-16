using Demo02.Data;
using Demo02.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Demo02.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class LoyaltyController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LoyaltyController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Loyalty
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LoyaltyAccount>>> GetLoyaltyAccounts()
        {
            return await _context.LoyaltyAccounts
                .Include(a => a.Guest)
                .OrderByDescending(a => a.CurrentPoints)
                .ToListAsync();
        }

        // GET: api/Loyalty/5
        [HttpGet("{id}")]
        public async Task<ActionResult<LoyaltyAccount>> GetLoyaltyAccount(Guid id)
        {
            var account = await _context.LoyaltyAccounts
                .Include(a => a.Guest)
                .FirstOrDefaultAsync(a => a.AccountId == id);

            if (account == null) return NotFound();
            return account;
        }

        // GET: api/Loyalty/transactions/{accountId}
        [HttpGet("transactions/{accountId}")]
        public async Task<ActionResult<IEnumerable<LoyaltyTransaction>>> GetTransactions(Guid accountId)
        {
            return await _context.LoyaltyTransactions
                .Where(t => t.LoyaltyAccountId == accountId)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();
        }

        // POST: api/Loyalty/add-points
        [HttpPost("add-points")]
        public async Task<IActionResult> AddPoints([FromBody] AddPointsRequest request)
        {
            var account = await _context.LoyaltyAccounts.FindAsync(request.AccountId);
            if (account == null) return NotFound("Account not found");

            var transaction = new LoyaltyTransaction
            {
                LoyaltyAccountId = account.AccountId,
                Points = request.Points,
                Type = request.Points > 0 ? LoyaltyTxType.Earn : LoyaltyTxType.Redeem,
                Description = request.Description ?? "Manual adjustment by Admin",
                TransactionDate = DateTime.Now
            };

            account.CurrentPoints += request.Points;
            if (request.Points > 0) account.LifetimePoints += request.Points;

            // Update Tier logic
            UpdateTier(account);

            _context.LoyaltyTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Ok(account);
        }

        private void UpdateTier(LoyaltyAccount account)
        {
            // HMS: Sinh viên yêu cầu phân cấp độ phải đi theo điểm thực tế (CurrentPoints) 
            // nên khi trừ điểm thì hạng cũng phải tụt xuống tương ứng.
            if (account.CurrentPoints >= 50000) account.Tier = LoyaltyTier.Royal;
            else if (account.CurrentPoints >= 25000) account.Tier = LoyaltyTier.Diamond;
            else if (account.CurrentPoints >= 10000) account.Tier = LoyaltyTier.Platinum;
            else if (account.CurrentPoints >= 3000) account.Tier = LoyaltyTier.Gold;
            else if (account.CurrentPoints >= 1000) account.Tier = LoyaltyTier.Silver;
            else account.Tier = LoyaltyTier.Bronze;
        }
    }

    public class AddPointsRequest
    {
        public Guid AccountId { get; set; }
        public int Points { get; set; }
        public string? Description { get; set; }
    }
}
