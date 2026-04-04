using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Demo02.Data;
using Demo02.Models;
using Demo02.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Demo02.Controllers
{
    public class PublicBookingRequestDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public Guid RoomTypeId { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public int GuestCount { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class PublicBookingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PublicBookingController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("Submit")]
        public async Task<IActionResult> SubmitBooking([FromBody] PublicBookingRequestDto dto)
        {
            // --- 🛡️ VALIDATE NGHIỆP VỤ KHÁCH SẠN (BUSINESS LOGIC) ---
            
            // 1. Kiểm tra Ngày (Check-in không được ở quá khứ)
            if (dto.CheckInDate.Date < DateTime.Today)
                return BadRequest(new { message = "Ngày nhận phòng không thể ở quá khứ!" });

            // 2. Kiểm tra Thời gian ở (Check-out phải sau Check-in)
            if (dto.CheckOutDate.Date <= dto.CheckInDate.Date)
                return BadRequest(new { message = "Ngày trả phòng phải sau ngày nhận ít nhất 1 đêm!" });

            // 3. Kiểm tra Tên & SĐT (Regex tiếng Việt chuẩn)
            if (string.IsNullOrWhiteSpace(dto.FullName) || !System.Text.RegularExpressions.Regex.IsMatch(dto.FullName, @"^[a-zA-Z\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠưăâêôơẠ-ỹ]+$"))
                return BadRequest(new { message = "Họ và tên không hợp lệ!" });

            if (string.IsNullOrWhiteSpace(dto.Phone) || !System.Text.RegularExpressions.Regex.IsMatch(dto.Phone, @"^[0-9]{10}$"))
                return BadRequest(new { message = "Số điện thoại phải đúng 10 số!" });

            // 4. Kiểm tra Hạng phòng & Sức chứa
            var roomType = await _context.RoomTypes.FindAsync(dto.RoomTypeId);
            if (roomType == null) return NotFound(new { message = "Hạng phòng không tồn tại!" });

            if (dto.GuestCount > roomType.MaxOccupancy)
                return BadRequest(new { message = $"Hạng phòng này chỉ chứa tối đa {roomType.MaxOccupancy} người!" });

            // 5. Tìm phòng trống
            var availableRoom = await _context.Rooms
                .FirstOrDefaultAsync(r => r.RoomTypeId == dto.RoomTypeId && r.Status == RoomStatus.VacantClean);

            if (availableRoom == null)
                return BadRequest(new { message = "Rất tiếc, hạng phòng này vừa hết phòng trống sạch!" });

            // 6. Tính toán Tổng tiền (Nights * BasePrice)
            int nights = (int)(dto.CheckOutDate.Date - dto.CheckInDate.Date).TotalDays;
            decimal totalPrice = nights * roomType.BasePrice;

            // --- ✍️ THỰC THI GIAO DỊCH ---
            var guest = await _context.Guests.FirstOrDefaultAsync(g => g.Phone == dto.Phone);
            if (guest == null)
            {
                guest = new Guest {
                    FullName = dto.FullName, Phone = dto.Phone, Nationality = "Vietnam",
                    IdNumber = "O_" + Guid.NewGuid().ToString().Substring(0,8),
                    Email = "", GuestType = GuestType.Individual
                };
                _context.Guests.Add(guest);
                await _context.SaveChangesAsync();
            }

            var reservation = new Reservation {
                GuestId = guest.GuestId,
                RoomId = availableRoom.RoomId,
                BookingCode = "HMS-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper(),
                CheckInDate = dto.CheckInDate,
                CheckOutDate = dto.CheckOutDate,
                DepositAmount = 0,
                Status = ReservationStatus.Pending,
                CreatedAt = DateTime.Now
                // Nếu bạn có cột TotalPrice trong DB, hãy gán: TotalPrice = totalPrice
            };

            availableRoom.Status = RoomStatus.Reserved;
            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Yêu cầu đặt phòng đã được hệ thống ghi nhận!", 
                bookingCode = reservation.BookingCode,
                totalPrice = totalPrice,
                nights = nights
            });
        }
    }
}
