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
            return await _context.Invoices.ToListAsync();
        }

        // GET: api/Invoices/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Invoice>> GetInvoice(Guid id)
        {
            var invoice = await _context.Invoices.FindAsync(id);

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
            await _context.SaveChangesAsync();

            // Create Audit Log
            _context.AuditLogs.Add(new AuditLog {
                Action = "PaymentConfirmed",
                EntityName = "Invoice",
                EntityId = invoice.InvoiceId.ToString(),
                Timestamp = DateTime.UtcNow,
                UserId = "System", 
                Changes = $"Invoice {invoice.InvoiceNumber} marked as Paid."
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thanh toán đã được xác nhận thành công!" });
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
