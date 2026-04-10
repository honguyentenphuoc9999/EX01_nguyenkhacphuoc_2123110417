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
    public class RoomServiceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RoomServiceController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/RoomService/Order
        [HttpPost("Order")]
        public async Task<IActionResult> PostOrder([FromBody] RoomServiceOrder order)
        {
            // Kiểm tra Đơn đặt phòng đang ở (CheckedIn)
            var reservation = await _context.Reservations
                .FirstOrDefaultAsync(r => r.ReservationId == order.ReservationId && r.Status == ReservationStatus.CheckedIn);
            
            if (reservation == null) return BadRequest("Phòng này chưa được nhận hoặc đã trả, không thể gọi món.");

            order.Status = "InProgress"; // Gán sang InProgress ngay vì đã gán nhân viên
            order.CreatedAt = DateTime.Now;
            _context.RoomServiceOrders.Add(order);
            await _context.SaveChangesAsync();

            // --- 1. HMS SMART ASSIGN: Tìm nhân viên Phục vụ (Room Attendant) đang THỰC SỰ RẢNH ---
            var bestAttendant = await _context.Staffs
                .Where(s => s.Role == StaffRole.RoomAttendant && !s.IsDeleted)
                .Where(s => !_context.HousekeepingTasks.Any(t => t.AssignedStaffId == s.StaffId && t.Status == HmsTaskStatus.InProgress))
                .FirstOrDefaultAsync();

            // --- 2. LOGISTICS AUTOMATION: Tự động trừ kho vật tư/đồ uống ---
            // Giả sử OrderItems chứa tên món. HMS sẽ tìm trong kho và trừ 1 đơn vị (hoặc parse số lượng nếu có)
            var inventoryItems = await _context.InventoryItems.ToListAsync();
            foreach (var item in inventoryItems)
            {
                if (order.OrderItems.Contains(item.ItemName, StringComparison.OrdinalIgnoreCase))
                {
                    // Trừ kho (Mặc định 1 nếu không parse được số lượng phức tạp)
                    item.CurrentStock -= 1; 
                    
                    // Ghi log giao dịch kho
                    _context.InventoryTransactions.Add(new InventoryTransaction {
                        ItemId = item.ItemId,
                        QuantityChanged = -1,
                        Type = "Outbound",
                        ReferenceNumber = $"RS-{order.OrderId.ToString().Substring(0, 8)}",
                        Notes = $"Xuất kho phục vụ phòng {reservation.Room?.RoomNumber}"
                    });
                }
            }

            // --- 3. TẠO NHIỆM VỤ GIAO ĐỒ ---
            var deliveryTask = new HousekeepingTask
            {
                RoomId = order.RoomId,
                AssignedStaffId = bestAttendant?.StaffId,
                TaskType = HmsTaskType.Delivery, 
                Status = bestAttendant != null ? HmsTaskStatus.InProgress : HmsTaskStatus.Pending,
                Priority = Priority.High,
                ScheduledDate = DateTime.Now,
                Notes = $"[PHỤC VỤ PHÒNG] Giao món: {order.OrderItems}. Đơn hàng ID: {order.OrderId}"
            };
            _context.HousekeepingTasks.Add(deliveryTask);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã tiếp nhận yêu cầu gọi món. Nhân viên phục vụ sẽ giao đến ngay!", orderId = order.OrderId });
        }

        // POST: api/RoomService/ConfirmDelivery/{orderId}
        [HttpPost("{orderId}/confirm-delivery")]
        public async Task<IActionResult> ConfirmDelivery(Guid orderId)
        {
            var order = await _context.RoomServiceOrders
                .Include(o => o.Reservation)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) return NotFound();
            if (order.IsPaid) return BadRequest("Đơn hàng này đã được thanh toán rồi.");

            // 1. Cập nhật trạng thái đơn hàng
            order.Status = "Completed";
            order.IsPaid = true;

            // 2. Tìm Folio của Đơn đặt phòng để cộng tiền
            var folio = await _context.Folios.FirstOrDefaultAsync(f => f.ReservationId == order.ReservationId && f.Status == FolioStatus.Open);
            if (folio != null)
            {
                var charge = new FolioCharge
                {
                    FolioId = folio.FolioId,
                    Description = $"Room Service: {order.OrderItems}",
                    ChargeType = ChargeType.Service,
                    Quantity = 1,
                    UnitPrice = order.TotalAmount,
                    TotalAmount = order.TotalAmount,
                    ChargedAt = DateTime.Now,
                    ChargedBy = "Room Service"
                };
                _context.FolioCharges.Add(charge);
            }

            // 3. Hoàn thành nhiệm vụ giao hàng liên quan
            var task = await _context.HousekeepingTasks
                .FirstOrDefaultAsync(t => t.Notes!.Contains(orderId.ToString()) && t.Status != HmsTaskStatus.Completed);
            
            if (task != null)
            {
                task.Status = HmsTaskStatus.Completed;
                task.CompletedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return Ok("Xác nhận đã giao đồ và tự động cộng phí vào hóa đơn thành công!");
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveOrders()
        {
            return Ok(await _context.RoomServiceOrders
                .AsNoTracking()
                .Include(o => o.Room)
                .Where(o => o.Status != "Completed" && o.Status != "Cancelled")
                .ToListAsync());
        }
    }
}
