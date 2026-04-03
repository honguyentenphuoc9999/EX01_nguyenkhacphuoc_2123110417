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
        
        public Guid RoomId { get; set; } // Hỗ trợ gán 1 phòng nhanh
        [ForeignKey("RoomId")]
        public Room? Room { get; set; }

        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public DateTime? ActualCheckIn { get; set; }
        public DateTime? ActualCheckOut { get; set; }

        public BookingChannel Channel { get; set; } = BookingChannel.Direct;
        public string? OtaSource { get; set; }
        public bool IsOtaPrepaid { get; set; } = false;

        public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal DepositAmount { get; set; } = 0;
        
        [StringLength(1000)]
        public string? SpecialRequests { get; set; }

        public DateTime? CancelledAt { get; set; }
        public string? CancelledBy { get; set; }
        public string? CancellationReason { get; set; }
        public DateTime? NoShowDetectedAt { get; set; }

        [Timestamp]
        public byte[]? RowVersion { get; set; }

        // Bảng trung gian ReservationRoom (Vì 1 booking có thể đặt nhiều phòng)
        public ICollection<ReservationRoom>? ReservationRooms { get; set; }
    }
}