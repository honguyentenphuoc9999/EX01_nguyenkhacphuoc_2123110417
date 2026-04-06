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
        Task<bool> ConfirmReservationAsync(Guid id); // 🛡️ Smart Sync: Bổ sung quyền năng xác nhận cho Admin
        Task<ReservationResponseDto?> GetReservationByIdAsync(Guid id);
        Task<ReservationResponseDto> CreateReservationAsync(ReservationCreateDto dto);
        Task<bool> CheckInAsync(Guid id, CheckInDto? dto = null);
        Task<bool> CheckOutAsync(Guid id);
        Task<bool> AssignRoomAsync(Guid reservationId, Guid roomId);
        Task<bool> CancelAsync(Guid id, string reason);
        Task<Guid?> GetFolioIdByReservationIdAsync(Guid reservationId);
        Task<bool> CheckOutByRoomAsync(Guid roomId);
    }
}
