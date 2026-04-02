using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Demo02.Data.Repositories;
using Demo02.Models;
using Demo02.Models.DTOs;

namespace Demo02.Services
{
    public class ReservationService : IReservationService
    {
        private readonly IUnitOfWork _uow;

        public ReservationService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<IEnumerable<ReservationResponseDto>> GetAllReservationsAsync()
        {
            var data = await _uow.Reservations.GetAllAsync(r => r.Guest!);
            return data.Select(r => MapToResponse(r));
        }

        public async Task<ReservationResponseDto?> GetReservationByIdAsync(Guid id)
        {
            var r = await _uow.Reservations.GetByIdAsync(id, r => r.Guest!);
            return r != null ? MapToResponse(r) : null;
        }

        public async Task<ReservationResponseDto> CreateReservationAsync(ReservationCreateDto dto)
        {
            // Business Rule BR-01: (Simple Check for inventory would go here)
            
            var reservation = new Reservation
            {
                GuestId = dto.GuestId,
                CheckInDate = dto.CheckInDate,
                CheckOutDate = dto.CheckOutDate,
                Channel = dto.Channel,
                SpecialRequests = dto.SpecialRequests,
                BookingCode = "BK-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper(), // Simulation of business rule
                Status = ReservationStatus.Pending
            };

            await _uow.Reservations.AddAsync(reservation);
            await _uow.CompleteAsync();
            return MapToResponse(reservation);
        }

        public async Task<bool> CheckInAsync(Guid id)
        {
            var r = await _uow.Reservations.GetByIdAsync(id);
            if (r == null || (r.Status != ReservationStatus.Pending && r.Status != ReservationStatus.Confirmed))
                return false;

            r.Status = ReservationStatus.CheckedIn;
            r.ActualCheckIn = DateTime.Now;

            // Chuyển trạng thái phòng sang Occupied nều đã gán phòng
            if (r.RoomId != Guid.Empty)
            {
                var room = await _uow.Rooms.GetByIdAsync(r.RoomId);
                if (room != null) room.Status = RoomStatus.Occupied;
            }

            return await _uow.CompleteAsync() > 0;
        }

        public async Task<bool> CheckOutAsync(Guid id)
        {
            var r = await _uow.Reservations.GetByIdAsync(id);
            if (r == null || r.Status != ReservationStatus.CheckedIn) return false;

            // 1. Tìm Folio (UC-09)
            var folios = await _uow.Folios.FindAsync(f => f.ReservationId == id);
            var folio = folios.FirstOrDefault();
            if (folio == null) return false;

            // 2. Tính toán công nợ (Balance - BR-15)
            decimal subTotal = await CalculateFolioTotal(folio.FolioId);
            decimal vat = subTotal * 0.10m; // BR-16: Thuế 10%
            decimal total = subTotal + vat;

            // 3. Tạo Hóa đơn tự động (UC-10)
            var invoice = new Invoice
            {
                FolioId = folio.FolioId,
                InvoiceNumber = $"INV-{DateTime.Now:yyyyMMdd}-{id.ToString().Substring(0, 4)}",
                SubTotal = subTotal,
                VatAmount = vat,
                TotalAmount = total,
                Status = InvoiceStatus.Issued
            };
            _uow.Invoices.Add(invoice);

            // 4. Cập nhật trạng thái
            r.Status = ReservationStatus.CheckedOut;
            r.ActualCheckOut = DateTime.Now;
            folio.Status = FolioStatus.Closed;

            // Chuyển phòng sang trạng thái Bẩn để dọn dẹp (BR-13)
            if (r.RoomId != Guid.Empty)
            {
                var room = await _uow.Rooms.GetByIdAsync(r.RoomId);
                if (room != null) room.Status = RoomStatus.VacantDirty;
            }

            return await _uow.CompleteAsync() > 0;
        }

        public async Task<bool> AssignRoomAsync(Guid reservationId, Guid roomId)
        {
            var res = await _uow.Reservations.GetByIdAsync(reservationId);
            var room = await _uow.Rooms.GetByIdAsync(roomId);

            if (res == null || room == null || room.Status != RoomStatus.VacantClean) return false;

            res.RoomId = roomId;
            return await _uow.CompleteAsync() > 0;
        }

        private async Task<decimal> CalculateFolioTotal(Guid folioId)
        {
            var charges = await _uow.FolioCharges.FindAsync(c => c.FolioId == folioId);
            return charges.Sum(c => c.TotalAmount);
        }

        public async Task<bool> CancelAsync(Guid id, string reason)
        {
            var r = await _uow.Reservations.GetByIdAsync(id);
            if (r == null) return false;

            // BR-04: Cancellation policy verification (e.g. 24h before)
            if (r.CheckInDate.Date <= DateTime.Now.Date)
            {
                // Logic for No-show charge according to BR-04 could be added here
            }

            r.Status = ReservationStatus.Cancelled;
            r.CancelledAt = DateTime.Now;
            r.CancellationReason = reason;

            await _uow.CompleteAsync();
            return true;
        }

        private ReservationResponseDto MapToResponse(Reservation r)
        {
            return new ReservationResponseDto
            {
                ReservationId = r.ReservationId,
                BookingCode = r.BookingCode,
                GuestName = r.Guest?.FullName ?? "Unknown",
                CheckInDate = r.CheckInDate,
                CheckOutDate = r.CheckOutDate,
                Status = r.Status,
                DepositAmount = r.DepositAmount,
                CreatedAt = r.CreatedAt
            };
        }
    }
}
