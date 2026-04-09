using System.ComponentModel.DataAnnotations;
using Demo02.Models;

namespace Demo02.Models.DTOs
{
    public class ReservationCreateDto : IValidatableObject
    {
        [Required(ErrorMessage = "GuestId is required.")]
        public Guid GuestId { get; set; }

        [Required(ErrorMessage = "Check-in date is required.")]
        public DateTime CheckInDate { get; set; }

        [Required(ErrorMessage = "Check-out date is required.")]
        public DateTime CheckOutDate { get; set; }

        public BookingChannel Channel { get; set; } = BookingChannel.Direct;
        
        [StringLength(1000)]
        public string? SpecialRequests { get; set; }

        public List<Guid>? RoomIds { get; set; } = new List<Guid>();

        // --- HMS Rule: Custom Validation for Date Range ---
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (CheckOutDate <= CheckInDate)
            {
                yield return new ValidationResult("Check-out date must be later than Check-in date.", new[] { nameof(CheckOutDate) });
            }
            if (CheckInDate < DateTime.Now.Date)
            {
                yield return new ValidationResult("Check-in date cannot be in the past.", new[] { nameof(CheckInDate) });
            }
        }
    }

    public class ReservationUpdateDto
    {
        public ReservationStatus Status { get; set; }
        public string? CancellationReason { get; set; }
    }

    public class ReservationResponseDto
    {
        public Guid ReservationId { get; set; }
        public string BookingCode { get; set; } = string.Empty;
        public string GuestName { get; set; } = string.Empty;
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public ReservationStatus Status { get; set; }
        public decimal DepositAmount { get; set; }
        public string RoomNumber { get; set; } = "N/A";
        public string? CancellationReason { get; set; }
        public bool IsDeleted { get; set; }
        public List<InvoiceMinimalDto>? Invoices { get; set; }
        // We do NOT expose CreatedAt in final production response for clients
    }

    public class InvoiceMinimalDto
    {
        public Guid InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public InvoiceStatus Status { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class CheckInDto
    {
        [Required(ErrorMessage = "Vui lòng nhập số CCCD/Hộ chiếu.")]
        [RegularExpression(@"^\d{12}$", ErrorMessage = "Số CCCD phải bao gồm đúng 12 chữ số và không chứa chữ cái.")]
        public string IdNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng chọn quốc tịch.")]
        public string Nationality { get; set; } = "Vietnam";

        // Dữ liệu chiết xuất từ quét QR CCCD (Bảo mật - Không lưu ảnh)
        public string? HomeAddress { get; set; }
        public string? ScannedFullName { get; set; }
    }
}
