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

            order.Status = "Pending";
            order.CreatedAt = DateTime.Now;
            _context.RoomServiceOrders.Add(order);
            await _context.SaveChangesAsync();

            // --- TỰ ĐỘNG TẠO NHIỆM VỤ GIAO ĐỒ (DELIVERY) ---
            // Tìm nhân viên Phục vụ phòng (RoomAttendant - Role 6) rảnh nhất bằng 1 query duy nhất
            var bestAttendant = await _context.Staffs
                .Where(s => s.Role == StaffRole.RoomAttendant && !s.IsDeleted)
                .Select(s => new {
                    Staff = s,
                    TaskCount = _context.HousekeepingTasks.Count(t => t.AssignedStaffId == s.StaffId && t.Status == HmsTaskStatus.InProgress)
                })
                .OrderBy(x => x.TaskCount)
                .Select(x => x.Staff)
                .FirstOrDefaultAsync();

            var deliveryTask = new HousekeepingTask
            {
                RoomId = order.RoomId,
                AssignedStaffId = bestAttendant?.StaffId,
                TaskType = HmsTaskType.Delivery, // Loại GIAO ĐỒ
                Status = bestAttendant != null ? HmsTaskStatus.InProgress : HmsTaskStatus.Pending,
                Priority = Priority.High,
                ScheduledDate = DateTime.Now,
                Notes = $"GIAO MÓN: {order.OrderItems}. Đơn hàng ID: {order.OrderId}"
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
