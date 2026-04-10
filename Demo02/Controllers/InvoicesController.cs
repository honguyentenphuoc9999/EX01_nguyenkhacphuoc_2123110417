using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Demo02.Data;
using Demo02.Models;

namespace Demo02.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
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

        // POST: api/Invoices/5/mark-as-paid
        [HttpPost("{id}/mark-as-paid")]
        public async Task<IActionResult> MarkAsPaid(Guid id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound();

            invoice.Status = InvoiceStatus.Paid; 
            
            // --- TỰ ĐỘNG ĐỒNG BỘ: Chuyển Reservation sang Checked-Out khi đã thanh toán ---
            var detailedInvoice = await _context.Invoices
                .Include(i => i.Folio!)
                    .ThenInclude(f => f.Reservation!)
                        .ThenInclude(r => r.Guest)
                .FirstOrDefaultAsync(i => i.InvoiceId == id);

            if (detailedInvoice?.Folio?.Reservation != null)
            {
                var res = detailedInvoice.Folio.Reservation;
                
                // 1. Đồng bộ trạng thái đặt phòng
                if (res.Status == ReservationStatus.CheckedIn || res.Status == ReservationStatus.Confirmed)
                {
                    res.Status = ReservationStatus.CheckedOut;
                    res.ActualCheckOut = DateTime.Now;
                }

                // 2. GIẢI PHÓNG PHÒNG & TẠO VIỆC DỌN DẸP (Luôn thực hiện nếu thanh toán xong mà chưa dọn)
                if (res.RoomId.HasValue)
                {
                    var room = await _context.Rooms.FindAsync(res.RoomId.Value);
                    if (room != null && room.Status != RoomStatus.VacantDirty && room.Status != RoomStatus.VacantClean)
                    {
                        room.Status = RoomStatus.VacantDirty;
                        
                        // Kiểm tra xem đã có task dọn dẹp chưa (tránh tạo trùng)
                        bool hasTask = await _context.HousekeepingTasks.AnyAsync(t => t.RoomId == room.RoomId && t.Status != HmsTaskStatus.Completed);
                        if (!hasTask)
                        {
                            // --- HMS SMART ASSIGN: Tự động tìm nhân viên Buồng phòng (Housekeeper) đang rảnh (không làm phòng nào khác) ---
                            var freeHousekeeper = await _context.Staffs
                                .Where(s => s.Role == StaffRole.Housekeeper && !s.IsDeleted)
                                .Where(s => !_context.HousekeepingTasks.Any(t => t.AssignedStaffId == s.StaffId && t.Status == HmsTaskStatus.InProgress))
                                .FirstOrDefaultAsync();

                            var cleaningTask = new HousekeepingTask {
                                RoomId = res.RoomId.Value,
                                AssignedStaffId = freeHousekeeper?.StaffId, // Gán nhân viên rảnh (nếu có)
                                TaskType = HmsTaskType.Cleaning,
                                Status = freeHousekeeper != null ? HmsTaskStatus.InProgress : HmsTaskStatus.Pending,
                                Priority = Priority.Normal,
                                ScheduledDate = DateTime.Now,
                                Notes = $"Dọn phòng tự động sau khi hóa đơn {invoice.InvoiceNumber} thanh toán."
                            };
                            _context.HousekeepingTasks.Add(cleaningTask);
                        }
                    }
                }
                
                // 3. Đóng hồ sơ Folio
                detailedInvoice.Folio.Status = FolioStatus.Closed;

                // 4. TỰ ĐỘNG HỦY CÁC ĐƠN DỊCH VỤ ĐANG GIAO (BRD Nâng cấp)
                var pendingOrders = await _context.RoomServiceOrders
                    .Where(o => o.ReservationId == res.ReservationId && 
                               o.Status != "Completed" && 
                               o.Status != "Cancelled" && 
                               !o.Status.Contains("Cancelled"))
                    .ToListAsync();

                foreach (var order in pendingOrders)
                {
                    order.Status = "Cancelled - Guest Checked Out";
                    order.Notes = (order.Notes ?? "") + " [Hệ thống tự động hủy đơn do khách đã thanh toán Checkout]";
                }

                // 5. TỰ ĐỘNG HỦY CÁC HOUSEKEEPING TASK GIAO ĐỒ (Delivery Tasks)
                if (res.RoomId.HasValue)
                {
                    var deliveryTasks = await _context.HousekeepingTasks
                        .Where(t => t.RoomId == res.RoomId && 
                                   t.TaskType == HmsTaskType.Delivery && 
                                   t.Status != HmsTaskStatus.Completed && 
                                   t.Status != HmsTaskStatus.Cancelled)
                        .ToListAsync();

                    foreach (var task in deliveryTasks)
                    {
                        task.Status = HmsTaskStatus.Cancelled;
                        task.Notes = (task.Notes ?? "") + " [KHÁCH ĐÃ CHECKOUT - DỪNG GIAO ĐỒ]";
                    }
                }
            }

            await _context.SaveChangesAsync();

            // --- TỰ ĐỘNG CỘNG ĐIỂM LOYALTY (CRM) ---
            if (detailedInvoice?.Folio?.Reservation?.Guest != null)
            {
                var guest = detailedInvoice.Folio.Reservation.Guest;
                // Tìm tài khoản thành viên của khách
                var loyaltyAccount = await _context.LoyaltyAccounts.FirstOrDefaultAsync(a => a.GuestId == guest.GuestId);
                
                // --- TỰ ĐỘNG TẠO TÀI KHOẢN LOYALTY NẾU CHƯA CÓ ---
                if (loyaltyAccount == null)
                {
                    loyaltyAccount = new LoyaltyAccount
                    {
                        GuestId = guest.GuestId,
                        MemberNumber = "M-" + DateTime.Now.Ticks.ToString().Substring(10), // Sinh mã hội viên tạm thời
                        Tier = LoyaltyTier.Silver,
                        CurrentPoints = 0,
                        LifetimePoints = 0,
                        EnrolledAt = DateTime.Now,
                        CreatedAt = DateTime.Now,
                        CreatedBy = "System_Auto"
                    };
                    _context.LoyaltyAccounts.Add(loyaltyAccount);
                    await _context.SaveChangesAsync();
                }

                if (loyaltyAccount != null)
                {
                    // Tỷ lệ: 10,000 VNĐ = 1 điểm
                    int pointsToAdd = (int)(detailedInvoice.TotalAmount / 10000);
                    
                    if (pointsToAdd > 0)
                    {
                        loyaltyAccount.CurrentPoints += pointsToAdd;
                        loyaltyAccount.LifetimePoints += pointsToAdd;
                        
                        // Ghi lại lịch sử giao dịch điểm 
                        _context.LoyaltyTransactions.Add(new LoyaltyTransaction
                        {
                            LoyaltyAccountId = loyaltyAccount.AccountId,
                            Points = pointsToAdd,
                            Type = LoyaltyTxType.Earn,
                            Description = $"Tích điểm từ hóa đơn {detailedInvoice.InvoiceNumber}",
                            TransactionDate = DateTime.Now,
                            CreatedAt = DateTime.Now,
                            CreatedBy = "System"
                        });
                    }
                }
            }

            // Create Audit Log
            _context.AuditLogs.Add(new AuditLog {
                Action = "PaymentConfirmed_WithLoyalty",
                EntityName = "Invoice",
                EntityId = invoice.InvoiceId.ToString(),
                Timestamp = DateTime.UtcNow,
                UserId = "System", 
                Changes = $"Invoice {invoice.InvoiceNumber} marked as Paid. Points added to guest."
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thanh toán thành công và đã tích điểm cho khách hàng!" });
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
