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
    public class FolioChargesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FolioChargesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/FolioCharges
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FolioCharge>>> GetFolioCharges()
        {
            return await _context.FolioCharges.ToListAsync();
        }

        // GET: api/FolioCharges/5
        [HttpGet("{id}")]
        public async Task<ActionResult<FolioCharge>> GetFolioCharge(Guid id)
        {
            var folioCharge = await _context.FolioCharges.FindAsync(id);

            if (folioCharge == null)
            {
                return NotFound();
            }

            return folioCharge;
        }

        // PUT: api/FolioCharges/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFolioCharge(Guid id, FolioCharge folioCharge)
        {
            if (id != folioCharge.ChargeId)
            {
                return BadRequest();
            }

            // Recalculate TotalAmount
            folioCharge.TotalAmount = folioCharge.Quantity * folioCharge.UnitPrice;
            _context.Entry(folioCharge).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                await UpdateFolioTotals(folioCharge.FolioId);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!FolioChargeExists(id))
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

        // POST: api/FolioCharges
        [HttpPost]
        public async Task<ActionResult<FolioCharge>> PostFolioCharge(FolioCharge folioCharge)
        {
            // Recalculate TotalAmount before saving
            folioCharge.TotalAmount = folioCharge.Quantity * folioCharge.UnitPrice;
            _context.FolioCharges.Add(folioCharge);
            await _context.SaveChangesAsync();
            
            // Cập nhật lại tổng tiền trong Folio
            await UpdateFolioTotals(folioCharge.FolioId);

            return CreatedAtAction("GetFolioCharge", new { id = folioCharge.ChargeId }, folioCharge);
        }

        // DELETE: api/FolioCharges/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFolioCharge(Guid id)
        {
            var folioCharge = await _context.FolioCharges.FindAsync(id);
            if (folioCharge == null)
            {
                return NotFound();
            }

            Guid folioId = folioCharge.FolioId;
            _context.FolioCharges.Remove(folioCharge);
            await _context.SaveChangesAsync();
            
            // Cập nhật lại tổng tiền trong Folio
            await UpdateFolioTotals(folioId);

            return NoContent();
        }

        private async Task UpdateFolioTotals(Guid folioId)
        {
            var folio = await _context.Folios.Include(f => f.Charges).FirstOrDefaultAsync(f => f.FolioId == folioId);
            if (folio != null)
            {
                folio.TotalCharges = folio.Charges?.Sum(c => c.TotalAmount) ?? 0;
                folio.Balance = folio.TotalCharges - folio.TotalPayments;
                await _context.SaveChangesAsync();
            }
        }

        private bool FolioChargeExists(Guid id)
        {
            return _context.FolioCharges.Any(e => e.ChargeId == id);
        }
    }
}
