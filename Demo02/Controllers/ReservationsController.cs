using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Demo02.Services;
using Demo02.Models.DTOs;

using Microsoft.AspNetCore.Authorization;

namespace Demo02.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Manager,Receptionist")] // Cho phép đặt phòng với các quyền quản trị & lễ tân
    public class ReservationsController : ControllerBase
    {
        private readonly IReservationService _reservationService;

        public ReservationsController(IReservationService reservationService)
        {
            _reservationService = reservationService;
        }

        // GET: api/Reservations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReservationResponseDto>>> GetReservations()
        {
            var results = await _reservationService.GetAllReservationsAsync();
            return Ok(results);
        }

        [HttpPost("{id}/confirm")]
        public async Task<IActionResult> Confirm(Guid id)
        {
            var success = await _reservationService.ConfirmReservationAsync(id);
            return success ? Ok("Reservation confirmed.") : BadRequest("Failed to confirm.");
        }

        // GET: api/Reservations/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ReservationResponseDto>> GetReservation(Guid id)
        {
            var r = await _reservationService.GetReservationByIdAsync(id);
            if (r == null) return NotFound();
            return Ok(r);
        }

        // POST: api/Reservations
        [HttpPost]
        public async Task<ActionResult<ReservationResponseDto>> PostReservation(ReservationCreateDto dto)
        {
            // HMS Security Enforcement: Admin and Manager cannot create reservations to ensure data integrity
            if (User.IsInRole("Admin") || User.IsInRole("Manager"))
            {
                return BadRequest("Tài khoản quản trị/quản lý không được phép đặt phòng. Vui lòng sử dụng tài khoản khách hàng thực tế để thực hiện giao dịch này!");
            }

            var result = await _reservationService.CreateReservationAsync(dto);
            return CreatedAtAction("GetReservation", new { id = result.ReservationId }, result);
        }

        // POST: api/Reservations/5/check-in
        [HttpPost("{id}/check-in")]
        public async Task<IActionResult> CheckIn(Guid id, [FromBody] CheckInDto? dto)
        {
            var success = await _reservationService.CheckInAsync(id, dto);
            if (!success) return BadRequest("Check-in failed. Please check reservation status.");
            
            // Lấy Folio ID để trả về cho người dùng dễ test
            var folioId = await _reservationService.GetFolioIdByReservationIdAsync(id);
            return Ok(new { message = "Check-in thành công!", folioId = folioId });
        }

        // POST: api/Reservations/5/cancel
        [HttpPost("{id}/check-out")]
        public async Task<IActionResult> PostCheckOut(Guid id)
        {
            var success = await _reservationService.CheckOutAsync(id);
            if (!success) return BadRequest("Check-out failed. Ensure reservation is CheckedIn and Folio exists.");
            return Ok("Check-out successful. Invoice generated.");
        }

        [HttpPost("{id}/assign-room/{roomId}")]
        public async Task<IActionResult> PostAssignRoom(Guid id, Guid roomId)
        {
            var success = await _reservationService.AssignRoomAsync(id, roomId);
            if (!success) return BadRequest("Room assignment failed. Ensure room is VacantClean.");
            return Ok("Room assigned successfully.");
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> Cancel(Guid id, [FromBody] string reason)
        {
            var success = await _reservationService.CancelAsync(id, reason);
            if (!success) return NotFound();
            return Ok("Reservation cancelled.");
        }
        [HttpPost("checkout-by-room/{roomId}")]
        public async Task<IActionResult> CheckOutByRoom(Guid roomId)
        {
            var success = await _reservationService.CheckOutByRoomAsync(roomId);
            if (!success) return BadRequest("Could not check out this room. Check if it's currently occupied.");
            return Ok("Check-out successful. Invoice generated and Housekeeping task created.");
        }

        // DELETE: api/Reservations/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReservation(Guid id, [FromQuery] string? reason, [FromServices] Demo02.Data.AppDbContext context)
        {
            // --- 🛡️ ADMIN PRIVILEGE: Cho phép xóa không cần lý do ---
            string effectiveReason = string.IsNullOrEmpty(reason) ? "Hành động bởi Quản trị viên" : reason;

            var reservation = await context.Reservations
                .IgnoreQueryFilters()
                .Include(r => r.ReservationRooms)
                .FirstOrDefaultAsync(r => r.ReservationId == id);

            if (reservation == null) return NotFound();

            // 1. Giải phóng trạng thái phòng chính
            if (reservation.RoomId.HasValue && reservation.RoomId != Guid.Empty)
            {
                var room = await context.Rooms.FindAsync(reservation.RoomId.Value);
                if (room != null) room.Status = Demo02.Models.RoomStatus.VacantClean;
            }

            // 2. Giải phóng trạng thái các phòng trong đoàn (nếu có)
            if (reservation.ReservationRooms != null && reservation.ReservationRooms.Any())
            {
                foreach (var resRoom in reservation.ReservationRooms)
                {
                    var room = await context.Rooms.FindAsync(resRoom.RoomId);
                    if (room != null) room.Status = Demo02.Models.RoomStatus.VacantClean;
                }
            }
            
            // --- 🛡️ Ghi lý do vào bản ghi trước khi xóa (Để hiển thị lại trong lịch sử) ---
            reservation.CancellationReason = effectiveReason;
            reservation.Status = Demo02.Models.ReservationStatus.Cancelled;
            reservation.CancelledAt = DateTime.UtcNow;

            // Lưu vào Nhật ký Audit trước khi xóa
            context.AuditLogs.Add(new Demo02.Models.AuditLog {
                Action = "ReservationDeletionRequested",
                EntityName = "Reservation",
                EntityId = id.ToString(),
                Timestamp = DateTime.UtcNow,
                UserId = "Admin", // Nên thay bằng User.Identity.Name
                Changes = $"Lý do: {effectiveReason}. Thông tin đính kèm: Guest ID: {reservation.GuestId}, Room ID: {reservation.RoomId}"
            });

            context.Reservations.Remove(reservation);
            await context.SaveChangesAsync();

            return NoContent();
        }
    }
}
