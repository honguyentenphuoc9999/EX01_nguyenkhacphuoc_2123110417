using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Demo02.Data.Repositories;
using Demo02.Models;
using Demo02.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Demo02.Services
{
    public class ReservationService : IReservationService
    {
        private readonly IUnitOfWork _uow;
        private readonly ILogger<ReservationService> _logger;

        public ReservationService(IUnitOfWork uow, ILogger<ReservationService> logger)
        {
            _uow = uow;
            _logger = logger;
        }

        public async Task<IEnumerable<ReservationResponseDto>> GetAllReservationsAsync()
        {
            var data = await _uow.Reservations.GetAllAsync(r => r.Guest!, r => r.Room!);
            return data.Select(r => MapToResponse(r));
        }

        public async Task<ReservationResponseDto?> GetReservationByIdAsync(Guid id)
        {
            var r = await _uow.Reservations.GetByIdAsync(id, r => r.Guest!, r => r.Room!);
            return r != null ? MapToResponse(r) : null;
        }

        public async Task<ReservationResponseDto> CreateReservationAsync(ReservationCreateDto dto)
        {
            // --- HMS Rule: Đảm bảo toàn bộ phòng trong đoàn đều còn trống ---
            if (dto.RoomIds != null && dto.RoomIds.Any())
            {
                foreach (var roomId in dto.RoomIds)
                {
                    if (!await IsRoomAvailableAsync(roomId, dto.CheckInDate, dto.CheckOutDate))
                    {
                        var room = await _uow.Rooms.GetByIdAsync(roomId);
                        throw new InvalidOperationException($"Phòng {room?.RoomNumber} đã có người đặt hoặc đang trong lịch dọn dẹp.");
                    }
                }
            }

            var reservation = new Reservation
            {
                GuestId = dto.GuestId,
                CheckInDate = dto.CheckInDate.Date.AddHours(14), // Mặc định Check-in 14:00
                CheckOutDate = dto.CheckOutDate.Date.AddHours(12), // Mặc định Check-out 12:00
                Channel = dto.Channel,
                SpecialRequests = dto.SpecialRequests,
                BookingCode = "BK-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper(),
                Status = ReservationStatus.Pending,
                RoomId = dto.RoomIds?.FirstOrDefault() ?? Guid.Empty // Link phòng đầu tiên làm QuickID
            };

            await _uow.Reservations.AddAsync(reservation);
            await _uow.CompleteAsync(); // Lưu trước ReservationId

            // Tạo các bản ghi chi tiết cho từng phòng
            if (dto.RoomIds != null)
            {
                foreach (var rId in dto.RoomIds)
                {
                    var room = await _uow.Rooms.GetByIdAsync(rId);
                    if (room != null)
                    {
                        var resRoom = new ReservationRoom
                        {
                            ReservationId = reservation.ReservationId,
                            RoomId = rId,
                            RoomTypeId = room.RoomTypeId,
                            RoomRate = room.BasePrice
                        };
                        _uow.ReservationRooms.Add(resRoom);
                    }
                }
                await _uow.CompleteAsync();
            }

            return MapToResponse(reservation);
        }

        private async Task<bool> IsRoomAvailableAsync(Guid roomId, DateTime checkIn, DateTime checkOut)
        {
            // Quy tắc: Check-in 14:00, Check-out 12:00. Buffer 2 tiếng dọn phòng.
            var start = checkIn.Date.AddHours(14);
            var end = checkOut.Date.AddHours(12);

            // Kiểm tra các đặt phòng hiện tại trong bảng ReservationRooms
            // Điều kiện: StartMới < (EndCũ + 2h) VÀ EndMới > (StartCũ - 2h)
            var overlaps = await _uow.ReservationRooms.FindAsync(rr => 
                rr.RoomId == roomId && 
                rr.Reservation!.Status != ReservationStatus.Cancelled &&
                start < rr.Reservation.CheckOutDate.AddHours(2) && // Cộng 2 tiếng dọn dẹp sau check-out
                end > rr.Reservation.CheckInDate.AddHours(-2)); // Trừ 2 tiếng dọn dẹp trước check-in

            return !overlaps.Any();
        }

        public async Task<bool> CheckInAsync(Guid id)
        {
            var r = await _uow.Reservations.GetByIdAsync(id, res => res.ReservationRooms!);
            if (r == null || (r.Status != ReservationStatus.Pending && r.Status != ReservationStatus.Confirmed))
                return false;

            r.Status = ReservationStatus.CheckedIn;
            r.ActualCheckIn = DateTime.Now;

            // --- BR-02: Early Check-in Surcharge Logic ---
            var checkInHour = r.ActualCheckIn.Value.Hour;
            decimal surchargeRate = 0;
            if (checkInHour < 6) surchargeRate = 1.0m;
            else if (checkInHour < 9) surchargeRate = 0.5m;

            // --- HMS Rule: Luôn tạo Folio khi Check-in để khách có thể sử dụng dịch vụ ---
            var folio = await GetOrCreateFolio(r.ReservationId);

            if (surchargeRate > 0)
            {
                var roomRate = r.ReservationRooms?.FirstOrDefault()?.RoomRate ?? 0;
                await AddSurcharge(folio.FolioId, roomRate * surchargeRate, $"Early Check-in Fee ({surchargeRate * 100}%)");
            }

            // Chuyển trạng thái phòng sang Occupied nều đã gán phòng
            if (r.RoomId != Guid.Empty)
            {
                var room = await _uow.Rooms.GetByIdAsync(r.RoomId);
                if (room != null) room.Status = RoomStatus.Occupied;
            }

            try
            {
                return await _uow.CompleteAsync() > 0;
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency conflict during update.");
                return false;
            }
        }

        public async Task<bool> CheckOutAsync(Guid id)
        {
            var r = await _uow.Reservations.GetByIdAsync(id, res => res.ReservationRooms!);
            if (r == null || r.Status != ReservationStatus.CheckedIn) return false;

            r.ActualCheckOut = DateTime.Now;
            var folio = await GetOrCreateFolio(r.ReservationId);

            // --- BR-03: Late Check-out Surcharge Logic ---
            var checkOutHour = r.ActualCheckOut.Value.Hour;
            decimal surchargeRate = 0;
            if (checkOutHour >= 18) surchargeRate = 1.0m;
            else if (checkOutHour >= 15) surchargeRate = 0.5m;
            else if (checkOutHour >= 12) surchargeRate = 0.3m;

            if (surchargeRate > 0)
            {
                var roomRate = r.ReservationRooms?.FirstOrDefault()?.RoomRate ?? 0;
                await AddSurcharge(folio.FolioId, roomRate * surchargeRate, $"Late Check-out Fee ({surchargeRate*100}%)");
            }

            // --- HMS Fix: Thêm tiền phòng gốc vào hóa đơn ---
            var baseRoomRate = r.ReservationRooms?.FirstOrDefault()?.RoomRate ?? 0;
            await AddSurcharge(folio.FolioId, baseRoomRate, "Phí thuê phòng (Base Room Rate)");

            // --- BR-15 & BR-16: Finance Logic ---
            decimal subTotal = await CalculateFolioTotal(folio.FolioId);
            decimal vat = subTotal * 0.10m; // BR-16: Thuế 10%
            decimal total = subTotal + vat;

            // --- UC-10: Auto-generate Invoice ---
            var invoice = new Invoice {
                FolioId = folio.FolioId,
                InvoiceNumber = $"INV-{DateTime.Now:yyyyMMdd}-{id.ToString().Substring(0, 4).ToUpper()}",
                SubTotal = subTotal,
                VatAmount = vat,
                TotalAmount = total,
                Status = InvoiceStatus.Issued
            };
            _uow.Invoices.Add(invoice);

            // --- BR-13: Loyalty Points (1 VND = 1 Point) ---
            var loyalty = (await _uow.LoyaltyAccounts.FindAsync(a => a.GuestId == r.GuestId)).FirstOrDefault();
            if (loyalty != null)
            {
                loyalty.CurrentPoints += (int)total;
                loyalty.LifetimePoints += (int)total;

                // --- BRD Rule: Tự động thăng hạng thành viên ---
                if (loyalty.LifetimePoints > 50000) loyalty.Tier = LoyaltyTier.Platinum;
                else if (loyalty.LifetimePoints > 10000) loyalty.Tier = LoyaltyTier.Gold;
                else loyalty.Tier = LoyaltyTier.Silver;
            }

            r.Status = ReservationStatus.CheckedOut;
            folio.Status = FolioStatus.Closed;

            // --- BR-13: Room Cleanup Automation ---
            if (r.RoomId != Guid.Empty)
            {
                var room = await _uow.Rooms.GetByIdAsync(r.RoomId);
                if (room != null) 
                {
                    room.Status = RoomStatus.VacantDirty;
                    
                    // --- Tự động tạo Task dọn phòng cho bộ phận Housekeeping (UC-09) ---
                    var cleaningTask = new HousekeepingTask {
                        RoomId = r.RoomId,
                        TaskType = HmsTaskType.Cleaning,
                        Status = HmsTaskStatus.Pending,
                        Priority = Priority.Normal,
                        ScheduledDate = DateTime.Now,
                        Notes = $"Auto-generated task after checkout of booking {r.BookingCode}"
                    };
                    _uow.HousekeepingTasks.Add(cleaningTask);
                }
            }

            try
            {
                return await _uow.CompleteAsync() > 0;
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency conflict during update.");
                return false;
            }
        }

        private async Task<Folio> GetOrCreateFolio(Guid reservationId)
        {
            var folios = await _uow.Folios.FindAsync(f => f.ReservationId == reservationId);
            var folio = folios.FirstOrDefault();
            if (folio == null)
            {
                folio = new Folio { ReservationId = reservationId, Status = FolioStatus.Open };
                _uow.Folios.Add(folio);
                await _uow.CompleteAsync();
            }
            return folio;
        }

        private async Task AddSurcharge(Guid folioId, decimal amount, string description)
        {
            var charge = new FolioCharge {
                FolioId = folioId,
                Description = description,
                ChargeType = ChargeType.Surcharge,
                Quantity = 1,
                UnitPrice = amount,
                TotalAmount = amount,
                ChargedAt = DateTime.Now,
                ChargedBy = "System"
            };
            await _uow.FolioCharges.AddAsync(charge);
        }

        public async Task<bool> AssignRoomAsync(Guid reservationId, Guid roomId)
        {
            var res = await _uow.Reservations.GetByIdAsync(reservationId, r => r.ReservationRooms!);
            var room = await _uow.Rooms.GetByIdAsync(roomId);

            if (res == null || room == null || room.Status != RoomStatus.VacantClean) return false;
            
            if (res.CheckInDate.Date > DateTime.Now.AddDays(1).Date)
                return false;

            res.RoomId = roomId;

            // --- LÔI QUAN TRỌNG: Phải tạo bản ghi ReservationRoom để lưu GIÁ TIỀN ---
            if (res.ReservationRooms == null || !res.ReservationRooms.Any())
            {
                var resRoom = new ReservationRoom
                {
                    ReservationId = reservationId,
                    RoomId = roomId,
                    RoomTypeId = room.RoomTypeId, // GHÉP THÊM LOẠI PHÒNG VÀO ĐÂY
                    RoomRate = room.BasePrice // Lấy giá gốc từ phòng
                };
                _uow.ReservationRooms.Add(resRoom);
            }

            try
            {
                return await _uow.CompleteAsync() > 0;
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency conflict during update.");
                return false;
            }
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

            // --- BR-04: Cancellation Policy Implementation ---
            var leadTime = (r.CheckInDate.Date - DateTime.Now.Date).TotalHours;
            
            // Logic for refund/fee based on leadTime could be added to Folio here

            r.Status = ReservationStatus.Cancelled;
            r.CancelledAt = DateTime.Now;
            r.CancellationReason = reason;

            try
            {
                return await _uow.CompleteAsync() > 0;
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency conflict during update.");
                return false;
            }
        }

        public async Task<Guid?> GetFolioIdByReservationIdAsync(Guid reservationId)
        {
            var portfolios = await _uow.Folios.FindAsync(f => f.ReservationId == reservationId);
            return portfolios?.FirstOrDefault()?.FolioId;
        }

        public async Task<bool> CheckOutByRoomAsync(Guid roomId)
        {
            var res = (await _uow.Reservations.FindAsync(r => r.RoomId == roomId && r.Status == ReservationStatus.CheckedIn))?.FirstOrDefault();
            if (res == null) return false;
            return await CheckOutAsync(res.ReservationId);
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
                RoomNumber = r.Room?.RoomNumber ?? "Chưa gán"
            };
        }
    }
}
