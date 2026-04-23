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
            // HMS STANDARD: Sử dụng ThenInclude để lấy dữ liệu đa tầng Đặt phòng -> Folio -> Hóa đơn
            var data = await _uow.Query<Reservation>()
                .Include(r => r.Guest)
                .Include(r => r.Room)
                .Include(r => r.Folios!)
                    .ThenInclude(f => f.Invoices)
                .ToListAsync();

            return data.Select(MapToResponse).ToList();
        }

        public async Task<bool> ConfirmReservationAsync(Guid id)
        {
            var r = await _uow.Reservations.GetByIdAsync(id);
            if (r == null || r.IsDeleted) return false;
            
            if (r.Status != ReservationStatus.Pending) return false;

            r.Status = ReservationStatus.Confirmed;
            return await _uow.CompleteAsync() > 0;
        }

        public async Task<ReservationResponseDto?> GetReservationByIdAsync(Guid id)
        {
            var r = await _uow.Query<Reservation>()
                .Include(r => r.Guest)
                .Include(r => r.Room)
                .Include(r => r.Folios!)
                    .ThenInclude(f => f.Invoices)
                .FirstOrDefaultAsync(r => r.ReservationId == id);

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
                RoomId = dto.RoomIds?.FirstOrDefault() // Để null nếu không có phòng nào được chọn
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
                !rr.Reservation!.IsDeleted && // 🛡️ Smart Fix: Loại bỏ đơn đã xóa
                rr.Reservation.Status != ReservationStatus.Cancelled && // Loại bỏ đơn đã hủy
                rr.Reservation.Status != ReservationStatus.NoShow &&    // Loại bỏ đơn vắng mặt
                start < rr.Reservation.CheckOutDate.AddHours(2) && 
                end > rr.Reservation.CheckInDate.AddHours(-2));

            return !overlaps.Any();
        }

        public async Task<bool> CheckInAsync(Guid id, CheckInDto? dto = null)
        {
            var r = await _uow.Reservations.GetByIdAsync(id, res => res.ReservationRooms!, res => res.Guest!);
            if (r == null || (r.Status != ReservationStatus.Pending && r.Status != ReservationStatus.Confirmed))
                return false;

            // --- 🛡️ ĐỐI SOÁT ĐỊNH DANH (IDENTITY VERIFICATION) ---
            if (dto != null && r.Guest != null)
            {
                if (!string.IsNullOrEmpty(dto.ScannedFullName))
                {
                    // Chuyển về chữ thường và không dấu để so sánh tương đối (Tránh lỗi do Unikey/Capslock)
                    string originalName = r.Guest.FullName.ToLower().Trim();
                    string scannedName = dto.ScannedFullName.ToLower().Trim();

                    // Nếu tên khác biệt quá lớn (Ví dụ: Nguyễn Văn A vs Trần Thị B) -> Cảnh báo bảo mật
                    if (originalName != scannedName && !originalName.Contains(scannedName) && !scannedName.Contains(originalName))
                    {
                        throw new InvalidOperationException($"Lỗi định danh: Tên trên CCCD ({dto.ScannedFullName}) không khớp với tên đã đặt phòng ({r.Guest.FullName}). Vui lòng kiểm tra lại giấy tờ!");
                    }
                    
                    r.Guest.FullName = dto.ScannedFullName; // Cập nhật tên chuẩn theo CCCD
                }

                // 🛡️ HMS STRICT IDENTITY VALIDATION 🛡️
                // Nếu khách hàng đã được xác minh danh tính trước đó (Verified)
                if (r.Guest.IsVerified && !string.IsNullOrEmpty(r.Guest.IdNumber))
                {
                    // Kiểm tra số CCCD mới có trùng khớp với số CCCD đã xác minh không
                    if (r.Guest.IdNumber != dto.IdNumber)
                    {
                        throw new InvalidOperationException($"CẢNH BÁO BẢO MẬT: Khách hàng {r.Guest.FullName} đã được xác minh trước đó với số CCCD {r.Guest.IdNumber}. " +
                            $"Số CCCD mới ({dto.IdNumber}) không trùng khớp. Hệ thống từ chối Check-in để đảm bảo an ninh!");
                    }
                }

                r.Guest.IdNumber = dto.IdNumber;
                r.Guest.Nationality = dto.Nationality;
                r.Guest.HomeAddress = dto.HomeAddress;
                r.Guest.IsVerified = true; // Xác minh lại trạng thái
            }

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

            // Chuyển trạng thái phòng sang Occupied
            if (r.RoomId.HasValue && r.RoomId != Guid.Empty)
            {
                var room = await _uow.Rooms.GetByIdAsync(r.RoomId.Value);
                if (room != null) room.Status = RoomStatus.Occupied;
            }

            if (r.ReservationRooms != null && r.ReservationRooms.Any())
            {
                foreach (var resRoom in r.ReservationRooms)
                {
                    if (resRoom.RoomId.HasValue)
                    {
                        var room = await _uow.Rooms.GetByIdAsync(resRoom.RoomId.Value);
                        if (room != null) room.Status = RoomStatus.Occupied;
                    }
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

        public async Task<bool> CheckOutAsync(Guid id)
        {
            var r = await _uow.Reservations.GetByIdAsync(id, res => res.ReservationRooms!, res => res.Guest!);
            if (r == null) return false;
            
            // 🛡️ HMS SAFETY GATE: Không được trả phòng nếu chưa nhận phòng hoặc đơn đã hủy
            if (r.Status != ReservationStatus.CheckedIn)
            {
                throw new InvalidOperationException("Không thể trả phòng cho đơn hàng chưa được 'Nhận phòng' (Checked-In)!");
            }

            r.ActualCheckOut = DateTime.Now;
            var folio = await GetOrCreateFolio(r.ReservationId);

            // --- HMS FINANCE FIX: Tính toán số đêm và giá phòng chính xác ---
            int nights = (r.CheckOutDate.Date - r.CheckInDate.Date).Days;
            if (nights <= 0) nights = 1;

            // --- HMS FINANCE FIX: Ưu tiên sử dụng TotalPrice từ Reservation (Đã tính chiết khấu VIP) ---
            decimal totalRoomCharge = r.TotalPrice;
            decimal baseRoomRate = r.ReservationRooms?.FirstOrDefault()?.RoomRate ?? 0;

            if (baseRoomRate == 0 && r.RoomId.HasValue && r.RoomId != Guid.Empty)
            {
                var room = await _uow.Rooms.GetByIdAsync(r.RoomId.Value);
                baseRoomRate = room?.BasePrice ?? 0;
            }

            if (totalRoomCharge <= 0)
            {
                totalRoomCharge = baseRoomRate * nights;
            }

            await AddSurcharge(folio.FolioId, totalRoomCharge, $"Phí thuê phòng (Trọn gói {nights} đêm)");

            // --- 🧊 BR-11: Tự động gom Minibar khi Check-out ---
            var minibarLogs = await _uow.MinibarLogs.FindAsync(m => m.ReservationId == id && !m.IsChargedToFolio);
            if (minibarLogs.Any())
            {
                decimal totalMinibar = minibarLogs.Sum(m => m.QuantityConsumed * m.UnitPrice);
                await AddSurcharge(folio.FolioId, totalMinibar, $"Tổng phí sử dụng Minibar & Amenities");
                
                foreach (var log in minibarLogs)
                {
                    log.IsChargedToFolio = true;
                    log.UpdatedAt = DateTime.Now;
                }
            }

            // --- BR-03: Late Check-out Surcharge Logic ---
            var checkOutHour = r.ActualCheckOut.Value.Hour;
            decimal surchargeRate = 0;
            if (checkOutHour >= 18) surchargeRate = 1.0m;
            else if (checkOutHour >= 15) surchargeRate = 0.5m;
            else if (checkOutHour >= 12) surchargeRate = 0.3m;

            if (surchargeRate > 0)
            {
                await AddSurcharge(folio.FolioId, baseRoomRate * surchargeRate, $"Phí trả phòng muộn ({surchargeRate * 100}%)");
            }

            // --- HMS FINANCE FIX: Lưu lại các phí vừa thêm trước khi tính tổng hóa đơn ---
            await _uow.CompleteAsync();

            // --- BR-15 & BR-16: Finance Logic ---
            decimal subTotal = await CalculateFolioTotal(folio.FolioId);
            decimal vat = subTotal * 0.10m; // BR-16: Thuế VAT 10%
            decimal total = subTotal + vat;

            // --- UC-10: Auto-generate Invoice & VIETQR ---
            var invoiceNumber = $"INV-{DateTime.Now:yyyyMMdd}-{id.ToString().Substring(0, 4).ToUpper()}";
            var invoice = new Invoice {
                FolioId = folio.FolioId,
                InvoiceNumber = invoiceNumber,
                SubTotal = subTotal,
                VatAmount = vat,
                TotalAmount = total,
                Status = InvoiceStatus.Issued,
                IssuedAt = DateTime.Now,
                // --- HMS Rule: Sinh mã VietQR năng động chuẩn khách sạn 5 sao ---
                PaymentQrCode = $"https://img.vietqr.io/image/970415-123456789-compact.png?amount={Math.Floor(total)}&addInfo={invoiceNumber}&accountName=HMS%20ROYAL%20HOTEL"
            };
            _uow.Invoices.Add(invoice);

            // --- BR-13: Loyalty Points (10,000 VND = 1 Point) ---
            var loyalty = (await _uow.LoyaltyAccounts.FindAsync(a => a.GuestId == r.GuestId)).FirstOrDefault();
            if (loyalty != null)
            {
                long pointsToAdd = (long)(total / 10000);
                if (pointsToAdd > 0)
                {
                    loyalty.CurrentPoints += pointsToAdd;
                    loyalty.LifetimePoints += pointsToAdd;
                }

                // --- BRD Rule: Tự động thăng hạng thành viên ---
                if (loyalty.LifetimePoints > 100000) loyalty.Tier = LoyaltyTier.Diamond;
                else if (loyalty.LifetimePoints > 50000) loyalty.Tier = LoyaltyTier.Platinum;
                else if (loyalty.LifetimePoints > 10000) loyalty.Tier = LoyaltyTier.Gold;
                else loyalty.Tier = LoyaltyTier.Silver;
            }

            r.Status = ReservationStatus.CheckedOut;
            folio.Status = FolioStatus.Closed;

            // --- BR-13: Room Cleanup Automation ---
            var roomsToClean = new List<Guid>();
            if (r.RoomId.HasValue && r.RoomId != Guid.Empty) roomsToClean.Add(r.RoomId.Value);

            if (r.ReservationRooms != null && r.ReservationRooms.Any())
            {
                foreach (var rr in r.ReservationRooms)
                {
                    if (rr.RoomId.HasValue && !roomsToClean.Contains(rr.RoomId.Value)) 
                        roomsToClean.Add(rr.RoomId.Value);
                }
            }

            // --- 🧠 SMART ASSIGNMENT: Tối ưu hóa tìm nhân sự ít việc nhất (Tránh lỗi .Result gây treo hệ thống) ---
            var staffs = await _uow.Staffs.FindAsync(s => s.Role == StaffRole.Housekeeper && !s.IsDeleted);
            
            // Lấy danh sách số lượng task đang thực hiện của từng nhân viên dọn phòng
            var activeTaskCounts = await _uow.Query<HousekeepingTask>()
                .Where(t => t.Status == HmsTaskStatus.InProgress && t.AssignedStaffId != null)
                .GroupBy(t => t.AssignedStaffId)
                .Select(g => new { StaffId = g.Key, Count = g.Count() })
                .ToListAsync();

            var staffToAssign = staffs
                .Select(s => new { 
                    Staff = s, 
                    Count = activeTaskCounts.FirstOrDefault(at => at.StaffId == s.StaffId)?.Count ?? 0 
                })
                .OrderBy(x => x.Count)
                .FirstOrDefault()?.Staff;


            foreach (var roomId in roomsToClean)
            {
                var room = await _uow.Rooms.GetByIdAsync(roomId);
                if (room != null) 
                {
                    room.Status = RoomStatus.VacantDirty; // 🛡️ CHỐT TRẠNG THÁI: Bắt buộc phải là Chưa dọn
                    
                    var cleaningTask = new HousekeepingTask {
                        RoomId = roomId,
                        AssignedStaffId = staffToAssign?.StaffId, 
                        TaskType = HmsTaskType.Cleaning,
                        Status = staffToAssign != null ? HmsTaskStatus.InProgress : HmsTaskStatus.Pending,
                        Priority = Priority.Normal,
                        ScheduledDate = DateTime.Now,
                        Notes = $"Auto-generated task after checkout. Assigned to: {staffToAssign?.FullName ?? "System"}"
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
                RoomNumber = r.Room?.RoomNumber ?? "Chưa gán",
                CancellationReason = r.CancellationReason,
                IsDeleted = r.IsDeleted,
                // Chuyển đổi Invoices từ Folios (nếu đã được Include) sang DTO an toàn
                Invoices = r.Folios?.Where(f => f.Invoices != null)
                    .SelectMany(f => f.Invoices!)
                    .Select(i => new InvoiceMinimalDto {
                        InvoiceId = i.InvoiceId,
                        InvoiceNumber = i.InvoiceNumber,
                        Status = i.Status,
                        TotalAmount = i.TotalAmount
                    }).ToList() ?? new List<InvoiceMinimalDto>()
            };
        }
    }
}
