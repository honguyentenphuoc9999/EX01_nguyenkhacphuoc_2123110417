using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Demo02.Services;
using Demo02.Models.DTOs;

using Microsoft.AspNetCore.Authorization;

namespace Demo02.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,FrontDesk")]
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
            return Ok(await _reservationService.GetAllReservationsAsync());
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
            var result = await _reservationService.CreateReservationAsync(dto);
            return CreatedAtAction("GetReservation", new { id = result.ReservationId }, result);
        }

        // POST: api/Reservations/5/check-in
        [HttpPost("{id}/check-in")]
        public async Task<IActionResult> CheckIn(Guid id)
        {
            var success = await _reservationService.CheckInAsync(id);
            if (!success) return BadRequest("Check-in failed. Please check reservation status.");
            
            // Lấy Folio ID để trả về cho người dùng dễ test
            var folioId = await _reservationService.GetFolioIdByReservationIdAsync(id);
            return Ok($"Check-in successful. Folio ID: {folioId}");
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
    }
}
