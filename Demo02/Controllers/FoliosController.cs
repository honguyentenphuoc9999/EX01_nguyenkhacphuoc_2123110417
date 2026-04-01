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
    public class FoliosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FoliosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Folios
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Folio>>> GetFolios()
        {
            return await _context.Folios.ToListAsync();
        }

        // GET: api/Folios/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Folio>> GetFolio(Guid id)
        {
            var folio = await _context.Folios.FindAsync(id);

            if (folio == null)
            {
                return NotFound();
            }

            return folio;
        }

        // PUT: api/Folios/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFolio(Guid id, Folio folio)
        {
            if (id != folio.FolioId)
            {
                return BadRequest();
            }

            _context.Entry(folio).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!FolioExists(id))
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

        // POST: api/Folios
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Folio>> PostFolio(Folio folio)
        {
            _context.Folios.Add(folio);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetFolio", new { id = folio.FolioId }, folio);
        }

        // DELETE: api/Folios/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFolio(Guid id)
        {
            var folio = await _context.Folios.FindAsync(id);
            if (folio == null)
            {
                return NotFound();
            }

            _context.Folios.Remove(folio);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool FolioExists(Guid id)
        {
            return _context.Folios.Any(e => e.FolioId == id);
        }
    }
}
