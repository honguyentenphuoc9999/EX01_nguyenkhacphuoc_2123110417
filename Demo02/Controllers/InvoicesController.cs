using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Demo02.Data;
using Demo02.Models;
using Microsoft.AspNetCore.Authorization;

namespace Demo02.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Manager,Receptionist")] // HMS Security: Kiểm soát quyền xác nhận thanh toán
    public class InvoicesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InvoicesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Invoices
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetInvoices()
        {
            return await _context.Invoices
                .Include(i => i.Folio!)
                    .ThenInclude(f => f.Reservation!)
                        .ThenInclude(r => r.Guest!)
                .Include(i => i.Folio!)
                    .ThenInclude(f => f.Reservation!)
                        .ThenInclude(r => r.Room!)
                .Include(i => i.Folio!)
                    .ThenInclude(f => f.Charges)
                .OrderByDescending(i => i.IssuedAt)
                .ToListAsync();
        }

        // GET: api/Invoices/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Invoice>> GetInvoice(Guid id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Folio!).ThenInclude(f => f.Reservation!).ThenInclude(r => r.Guest!)
                .Include(i => i.Folio!).ThenInclude(f => f.Reservation!).ThenInclude(r => r.Room!)
                .Include(i => i.Folio!).ThenInclude(f => f.Charges)
                .FirstOrDefaultAsync(i => i.InvoiceId == id);

            if (invoice == null)
            {
                return NotFound();
            }

            return invoice;
        }

        // PUT: api/Invoices/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutInvoice(Guid id, Invoice invoice)
        {
            if (id != invoice.InvoiceId)
            {
                return BadRequest();
            }

            // Recalculate amounts
            invoice.VatAmount = invoice.SubTotal * invoice.VatRate;
            invoice.TotalAmount = invoice.SubTotal + invoice.ServiceCharge + invoice.VatAmount;
            
            _context.Entry(invoice).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!InvoiceExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Invoices
        [HttpPost]
        public async Task<ActionResult<Invoice>> PostInvoice(Invoice invoice)
        {
            // Recalculate amounts before saving
            invoice.VatAmount = invoice.SubTotal * invoice.VatRate;
            invoice.TotalAmount = invoice.SubTotal + invoice.ServiceCharge + invoice.VatAmount;

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetInvoice", new { id = invoice.InvoiceId }, invoice);
        }

        // DELETE: api/Invoices/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(Guid id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Invoices/5/payment-info
        [HttpGet("{id}/payment-info")]
        public async Task<ActionResult<object>> GetPaymentInfo(Guid id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound();

            SystemSettings? settings;
            try 
            {
                settings = await _context.SystemSettings.FirstOrDefaultAsync();
                if (settings == null) 
                    return BadRequest("HỆ THỐNG: Bảng cấu hình ngân hàng đang TRỐNG DỮ LIỆU. Vui lòng khởi động lại Backend hoặc vào trang Cài đặt để nhập tài khoản Admin!");
            }
            catch (Exception ex)
            {
                return BadRequest($"LỖI CƠ SỞ DỮ LIỆU NGHIÊM TRỌNG: {ex.Message}");
            }
            
            var bank = settings.BankName;
            var accNum = settings.AccountNumber;
            var accName = settings.AccountHolder;

            if (string.IsNullOrEmpty(bank) || string.IsNullOrEmpty(accNum))
                return BadRequest("HỆ THỐNG: Thông tin ngân hàng của Admin (OCB/MB...) đang bị để TRỐNG. Vui lòng cấu hình lại!");

            // Format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NUMBER>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<INFO>&accountName=<NAME>
            var qrUrl = $"https://img.vietqr.io/image/{bank}-{accNum}-compact2.png" +
                        $"?amount={(int)invoice.TotalAmount}" +
                        $"&addInfo=Thanh toan HD {invoice.InvoiceNumber}" +
                        $"&accountName={Uri.EscapeDataString(accName)}";

            return new { 
                qrUrl, 
                bankName = bank, 
                accountNumber = accNum, 
                accountHolder = accName,
                amount = invoice.TotalAmount
            };
        }

        [HttpPost("{id}/mark-as-paid")]
        public async Task<IActionResult> MarkAsPaid(Guid id)
        {
            try 
            {
                // 1. Tải hóa đơn cùng đầy đủ thông tin liên quan trong 1 lần duy nhất để tránh xung đột tracking
                var invoice = await _context.Invoices
                    .Include(i => i.Folio!)
                        .ThenInclude(f => f.Reservation!)
                            .ThenInclude(r => r.Guest)
                    .Include(i => i.Folio!)
                        .ThenInclude(f => f.Reservation!)
                            .ThenInclude(r => r.Room)
                    .FirstOrDefaultAsync(i => i.InvoiceId == id);

                if (invoice == null) return NotFound(new { message = "Không tìm thấy hóa đơn!" });

                // 2. Cập nhật trạng thái hóa đơn
                invoice.Status = InvoiceStatus.Paid; 
                
                if (invoice.Folio?.Reservation != null)
                {
                    var res = invoice.Folio.Reservation;
                    
                    // 2.1. Đồng bộ trạng thái đặt phòng sang Checked-Out
                    if (res.Status == ReservationStatus.CheckedIn || res.Status == ReservationStatus.Confirmed)
                    {
                        res.Status = ReservationStatus.CheckedOut;
                        res.ActualCheckOut = DateTime.Now;
                    }

                    // 2.2. Giải phóng phòng và tạo Task dọn dẹp
                    if (res.RoomId.HasValue)
                    {
                        var room = await _context.Rooms.FindAsync(res.RoomId.Value);
                        if (room != null && room.Status != RoomStatus.VacantDirty && room.Status != RoomStatus.VacantClean)
                        {
                            room.Status = RoomStatus.VacantDirty;
                            
                            // Tạo task dọn dẹp nếu chưa có
                            bool hasTask = await _context.HousekeepingTasks.AnyAsync(t => t.RoomId == room.RoomId && t.Status != HmsTaskStatus.Completed);
                            if (!hasTask)
                            {
                                var freeHousekeeper = await _context.Staffs
                                    .Where(s => s.Role == StaffRole.Housekeeper && !s.IsDeleted)
                                    .Where(s => !_context.HousekeepingTasks.Any(t => t.AssignedStaffId == s.StaffId && t.Status == HmsTaskStatus.InProgress))
                                    .FirstOrDefaultAsync();

                                _context.HousekeepingTasks.Add(new HousekeepingTask {
                                    RoomId = res.RoomId.Value,
                                    AssignedStaffId = freeHousekeeper?.StaffId,
                                    TaskType = HmsTaskType.Cleaning,
                                    Status = freeHousekeeper != null ? HmsTaskStatus.InProgress : HmsTaskStatus.Pending,
                                    Priority = Priority.Normal,
                                    ScheduledDate = DateTime.Now,
                                    Notes = $"Dọn phòng tự động sau khi hóa đơn {invoice.InvoiceNumber} thanh toán."
                                });
                            }
                        }
                    }
                    
                    // 2.3. Đóng hồ sơ Folio
                    invoice.Folio.Status = FolioStatus.Closed;

                    // 2.4. Hủy các đơn dịch vụ chưa hoàn tất
                    var pendingOrders = await _context.RoomServiceOrders
                        .Where(o => o.ReservationId == res.ReservationId && 
                                   o.Status != "Completed" && 
                                   o.Status != "Cancelled")
                        .ToListAsync();

                    foreach (var order in pendingOrders)
                    {
                        order.Status = "Cancelled - Guest Checked Out";
                    }

                    // 2.5. Tích điểm Loyalty
                    if (res.Guest != null)
                    {
                        var guest = res.Guest;
                        var loyaltyAccount = await _context.LoyaltyAccounts.FirstOrDefaultAsync(a => a.GuestId == guest.GuestId);
                        
                        if (loyaltyAccount == null)
                        {
                            loyaltyAccount = new LoyaltyAccount {
                                GuestId = guest.GuestId,
                                MemberNumber = "M-" + DateTime.Now.Ticks.ToString().Substring(10),
                                Tier = LoyaltyTier.Silver,
                                EnrolledAt = DateTime.Now
                            };
                            _context.LoyaltyAccounts.Add(loyaltyAccount);
                        }

                        long pointsToAdd = (long)(invoice.TotalAmount / 10000);
                        if (pointsToAdd > 0)
                        {
                            loyaltyAccount.CurrentPoints += pointsToAdd;
                            loyaltyAccount.LifetimePoints += pointsToAdd;
                            
                            _context.LoyaltyTransactions.Add(new LoyaltyTransaction {
                                LoyaltyAccountId = loyaltyAccount.AccountId,
                                Points = pointsToAdd,
                                Type = LoyaltyTxType.Earn,
                                Description = $"Tích điểm từ hóa đơn {invoice.InvoiceNumber}",
                                TransactionDate = DateTime.Now
                            });
                        }
                    }
                }

                // 3. Ghi nhật ký Audit
                _context.AuditLogs.Add(new AuditLog {
                    Action = "PaymentConfirmed",
                    EntityName = "Invoice",
                    EntityId = invoice.InvoiceId.ToString(),
                    Timestamp = DateTime.UtcNow,
                    UserId = User.Identity?.Name ?? "System", 
                    Changes = $"Invoice {invoice.InvoiceNumber} marked as Paid."
                });

                // 4. LƯU TẤT CẢ TRONG 1 LẦN DUY NHẤT (Atomicity)
                await _context.SaveChangesAsync();

                return Ok(new { message = "Thanh toán thành công và đã đồng bộ hệ thống!" });
            }
            catch (Exception ex)
            {
                // Trả về lỗi chi tiết dạng JSON để frontend xử lý thay vì crash gây lỗi CORS
                return StatusCode(500, new { message = "Lỗi máy chủ khi xác nhận thanh toán: " + ex.Message });
            }
        }

        // DELETE: api/Invoices/5/safety-delete
        [HttpDelete("{id}/safety-delete")]
        public async Task<IActionResult> DeleteInvoice(Guid id, [FromQuery] string reason)
        {
            if (string.IsNullOrEmpty(reason)) return BadRequest("Bạn phải nêu rõ lý do xóa hóa đơn này (Yêu cầu nghiệp vụ)!");

            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound();

            // Store in Audit Log instead of total deletion to protect data
            _context.AuditLogs.Add(new AuditLog {
                Action = "InvoiceDeletionRequested",
                EntityName = "Invoice",
                EntityId = id.ToString(),
                Timestamp = DateTime.UtcNow,
                Changes = $"Lý do xóa: {reason}. Thông tin gốc: {invoice.InvoiceNumber}, Số tiền: {invoice.TotalAmount}"
            });

            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool InvoiceExists(Guid id)
        {
            return _context.Invoices.Any(e => e.InvoiceId == id);
        }
    }
}
