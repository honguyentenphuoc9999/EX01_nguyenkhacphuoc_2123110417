using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Demo02.Models
{
    public class Folio:BaseEntity
    {
        [Key]
        public Guid FolioId { get; set; } = Guid.NewGuid();

        public Guid ReservationId { get; set; }
        [ForeignKey("ReservationId")]
        public Reservation? Reservation { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalCharges { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPayments { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; }

        [Required]
        public FolioStatus Status { get; set; } = FolioStatus.Open;

        [Timestamp]
        public byte[]? RowVersion { get; set; }

        public ICollection<FolioCharge>? Charges { get; set; }
        public ICollection<Payment>? Payments { get; set; }
        public ICollection<Invoice>? Invoices { get; set; }
        public ICollection<Refund>? Refunds { get; set; }
    }
}
