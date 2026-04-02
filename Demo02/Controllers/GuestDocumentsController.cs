using Microsoft.AspNetCore.Mvc;
using Demo02.Data.Repositories;
using Demo02.Models;
using Demo02.Utilities;

namespace Demo02.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GuestDocumentsController : ControllerBase
    {
        private readonly IUnitOfWork _uow;

        public GuestDocumentsController(IUnitOfWork uow)
        {
            _uow = uow;
        }

        // POST: api/GuestDocuments
        // UC-05: Lưu quét giấy tờ (Security BR-05)
        [HttpPost]
        public async Task<IActionResult> PostDocument(GuestDocument doc)
        {
            // Mã hóa số giấy tờ trước khi lưu (BR-05)
            if (!string.IsNullOrEmpty(doc.DocumentNumber))
            {
                doc.DocumentNumber = EncryptionHelper.Encrypt(doc.DocumentNumber);
            }

            _uow.GuestDocuments.Add(doc);
            await _uow.CompleteAsync();
            return Ok("Document scanned and encrypted.");
        }

        // GET: api/GuestDocuments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<GuestDocument>> GetDocument(Guid id)
        {
            var doc = await _uow.GuestDocuments.GetByIdAsync(id);
            if (doc == null) return NotFound();

            // Giải mã để hiển thị (Nếu cần)
            if (!string.IsNullOrEmpty(doc.DocumentNumber))
            {
                doc.DocumentNumber = EncryptionHelper.Decrypt(doc.DocumentNumber);
            }
            return Ok(doc);
        }
    }
}
