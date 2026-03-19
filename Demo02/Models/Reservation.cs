using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Demo02.Models
{
    public class Reservation : BaseEntity
    {
        [Key]
        public Guid ReservationId { get; set; } = Guid.NewGuid();
        [Required, StringLength(20)]
        public string BookingCode { get; set; } = string.Empty;

        public Guid GuestId { get; set; }
        [ForeignKey("GuestId")]
        public Guest? Guest { get; set; }

        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public DateTime? ActualCheckIn { get; set; }
        public DateTime? ActualCheckOut { get; set; }

        [Required]
        public string Channel { get; set; } = "Trực tiếp";
        public string? OtaSource { get; set; }
        public bool IsOtaPrepaid { get; set; } = false;

        [Required]
        public string Status { get; set; } = "Chờ xác nhận";
        [Column(TypeName = "decimal(18,2)")]
        public decimal DepositAmount { get; set; } = 0;
        public string? SpecialRequests { get; set; }

        public DateTime? CancelledAt { get; set; }
        public string? CancelledBy { get; set; }
        public string? CancellationReason { get; set; }
        public DateTime? NoShowDetectedAt { get; set; }

        [Timestamp]
        public byte[]? RowVersion { get; set; }

        // Bảng trung gian ReservationRoom (Vì 1 booking có thể đặt nhiều phòng)
        public ICollection<Room>? Rooms { get; set; }
    }
}