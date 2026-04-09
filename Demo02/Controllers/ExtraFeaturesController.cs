using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Demo02.Data;
using Demo02.Models;
using Microsoft.AspNetCore.Authorization;

namespace Demo02.Controllers
{
    [Route("api/extra")]
    [ApiController]
    [Authorize]
    public class ExtraFeaturesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExtraFeaturesController(AppDbContext context)
        {
            _context = context;
        }

        // --- NHÓM CRM & LOYALTY ---

        [HttpGet("loyalty/accounts")]
        public async Task<IActionResult> GetLoyaltyAccounts()
        {
            var accounts = await _context.LoyaltyAccounts
                .Include(a => a.Guest)
                .ToListAsync();
            return Ok(accounts);
        }

        [HttpGet("loyalty/history/{accountId}")]
        public async Task<IActionResult> GetLoyaltyHistory(Guid accountId)
        {
            var history = await _context.LoyaltyTransactions
                .Where(t => t.LoyaltyAccountId == accountId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
            return Ok(history);
        }

        [HttpPost("loyalty/redeem")]
        [Authorize(Roles = "Admin,Manager,Receptionist")]
        public async Task<IActionResult> RedeemPoints([FromBody] LoyaltyRedeemRequest request)
        {
            var account = await _context.LoyaltyAccounts.FirstOrDefaultAsync(a => a.AccountId == request.LoyaltyAccountId);
            if (account == null) return NotFound("Không tìm thấy tài khoản thành viên.");
            if (account.CurrentPoints < request.Points) return BadRequest("Không đủ điểm để thực hiện giao dịch này.");

            account.CurrentPoints -= request.Points;
            
            var transaction = new LoyaltyTransaction
            {
                LoyaltyAccountId = request.LoyaltyAccountId,
                Points = -request.Points,
                Type = LoyaltyTxType.Redeem,
                Description = request.Description ?? "Đổi quà/dịch vụ tại quầy"
            };

            _context.LoyaltyTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đổi điểm thành công.", NewBalance = account.CurrentPoints });
        }

        // --- NHÓM LOGISTICS & KHO ---

        [HttpGet("inventory/items")]
        public async Task<IActionResult> GetInventoryItems()
        {
            var items = await _context.InventoryItems.ToListAsync();
            return Ok(items);
        }

        [HttpGet("inventory/transactions/{itemId}")]
        public async Task<IActionResult> GetInventoryTransactions(Guid itemId)
        {
            var txs = await _context.InventoryTransactions
                .Where(t => t.ItemId == itemId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
            return Ok(txs);
        }

        [HttpPost("inventory/transaction")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateInventoryTransaction([FromBody] InventoryTransactionRequest request)
        {
            var item = await _context.InventoryItems.FindAsync(request.ItemId);
            if (item == null) return NotFound("Sản phẩm không tồn tại.");

            item.CurrentStock += request.QuantityChanged;

            var transaction = new InventoryTransaction
            {
                ItemId = request.ItemId,
                QuantityChanged = request.QuantityChanged,
                Type = request.Type,
                ReferenceNumber = request.ReferenceNumber,
                Notes = request.Notes
            };

            _context.InventoryTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật kho thành công.", CurrentStock = item.CurrentStock });
        }

        // --- NHÓM F&B / DỊCH VỤ ---

        [HttpPost("services/book")]
        public async Task<IActionResult> BookService([FromBody] ServiceBooking booking)
        {
            _context.ServiceBookings.Add(booking);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đặt dịch vụ thành công.", BookingId = booking.BookingId });
        }

        [HttpGet("services/bookings")]
        public async Task<IActionResult> GetServiceBookings()
        {
            var bookings = await _context.ServiceBookings
                .Include(b => b.Guest)
                .Where(b => b.Status != "Finished" && b.Status != "Cancelled")
                .ToListAsync();
            return Ok(bookings);
        }

        // --- NHÓM MARKETING ---

        [HttpGet("marketing/campaigns")]
        public async Task<IActionResult> GetCampaigns()
        {
            return Ok(await _context.MarketingCampaigns.ToListAsync());
        }

        [HttpPost("marketing/campaign")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateCampaign([FromBody] MarketingCampaign campaign)
        {
            _context.MarketingCampaigns.Add(campaign);
            await _context.SaveChangesAsync();
            return Ok(campaign);
        }

        // --- NHÓM OTA INTEGRATION (MOCK) ---

        [HttpGet("ota/configs")]
        public async Task<IActionResult> GetOtaConfigs()
        {
            return Ok(await _context.OtaConfigs.ToListAsync());
        }

        [HttpGet("ota/sync-logs")]
        public async Task<IActionResult> GetSyncLogs()
        {
            return Ok(await _context.OtaSyncLogs.OrderByDescending(l => l.CreatedAt).Take(20).ToListAsync());
        }

        [HttpPost("ota/sync-reservations")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> SyncOtaReservations([FromQuery] string channel)
        {
            var log = new OtaSyncLog
            {
                Channel = channel == "Agoda" ? BookingChannel.OTA : BookingChannel.Direct,
                ExternalBookingCode = "EXT-" + Guid.NewGuid().ToString().Substring(0, 8),
                Action = "ManualSync",
                IsSuccess = true
            };

            _context.OtaSyncLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Đồng bộ thành công từ {channel}", SyncTime = log.CreatedAt });
        }
    }

    public class LoyaltyRedeemRequest
    {
        public Guid LoyaltyAccountId { get; set; }
        public int Points { get; set; }
        public string? Description { get; set; }
    }

    public class InventoryTransactionRequest
    {
        public Guid ItemId { get; set; }
        public decimal QuantityChanged { get; set; }
        public string Type { get; set; } = "Inbound";
        public string ReferenceNumber { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }
}
