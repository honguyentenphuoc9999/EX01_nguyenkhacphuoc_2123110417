using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Demo02.Models;
using Demo02.Models.DTOs;

namespace Demo02.Services
{
    public interface IReservationService
    {
        Task<IEnumerable<ReservationResponseDto>> GetAllReservationsAsync();
        Task<ReservationResponseDto?> GetReservationByIdAsync(Guid id);
        Task<ReservationResponseDto> CreateReservationAsync(ReservationCreateDto dto);
        Task<bool> CheckInAsync(Guid id);
        Task<bool> CheckOutAsync(Guid id);
        Task<bool> AssignRoomAsync(Guid reservationId, Guid roomId);
        Task<bool> CancelAsync(Guid id, string reason);
        Task<Guid?> GetFolioIdByReservationIdAsync(Guid reservationId);
        Task<bool> CheckOutByRoomAsync(Guid roomId);
    }
}
