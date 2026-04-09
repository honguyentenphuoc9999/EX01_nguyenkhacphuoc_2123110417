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
    public class InventoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InventoryController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Inventory
        [HttpGet]
        public async Task<ActionResult<IEnumerable<InventoryItem>>> GetInventory()
        {
            return await _context.InventoryItems.ToListAsync();
        }

        // POST: api/Inventory (Nhập kho)
        [HttpPost]
        public async Task<ActionResult<InventoryItem>> PostInventoryItem(InventoryItem item)
        {
            // Kiểm tra xem đã có mã này chưa
            var existing = await _context.InventoryItems.FirstOrDefaultAsync(i => i.ItemCode == item.ItemCode);
            
            if (existing != null)
            {
                // Cập nhật số lượng (Nhập thêm)
                existing.CurrentStock += item.CurrentStock;
                existing.UnitCost = item.UnitCost; // Cập nhật giá vốn mới nhất
                existing.SellingPrice = item.SellingPrice; // Cập nhật giá bán mới
                existing.IsForSale = item.IsForSale;
                existing.UpdatedAt = DateTime.Now;
                
                await _context.SaveChangesAsync();
                return Ok(existing);
            }

            item.CreatedAt = DateTime.Now;
            _context.InventoryItems.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetInventory", new { id = item.ItemId }, item);
        }

        // GET: api/Inventory/sale-menu (Lấy danh sách cho Menu gọi món)
        [HttpGet("sale-menu")]
        public async Task<ActionResult<IEnumerable<InventoryItem>>> GetSaleMenu()
        {
            return await _context.InventoryItems
                .Where(i => i.IsForSale && i.CurrentStock > 0)
                .ToListAsync();
        }
    }
}
