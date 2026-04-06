using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Demo02.Models
{
    public class Payment : BaseEntity
    {
        [Key]
        public Guid PaymentId { get; set; } = Guid.NewGuid();

        public Guid FolioId { get; set; }
        [ForeignKey("FolioId")]
        public Folio? Folio { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
        public PayMethod PaymentMethod { get; set; } = PayMethod.Cash;
        [StringLength(100)]
        public string? ReferenceCode { get; set; }
        public DateTime PaymentDate { get; set; } = DateTime.Now;
        public Guid CashierId { get; set; } // Liên kết đến Staff (Nhân viên thu ngân)
    }

    public class Invoice : BaseEntity
    {
        [Key]
        public Guid InvoiceId { get; set; } = Guid.NewGuid();

        public Guid FolioId { get; set; }
        [ForeignKey("FolioId")]
        public Folio? Folio { get; set; }

        [Required, StringLength(30)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal ServiceCharge { get; set; }
        [Column(TypeName = "decimal(5,4)")]
        public decimal VatRate { get; set; } = 0.10m;
        [Column(TypeName = "decimal(18,2)")]
        public decimal VatAmount { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
        public DateTime? IssuedAt { get; set; }
        public string? CancelledBy { get; set; }
        public string? CancellationReason { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? PaymentQrCode { get; set; }

        [Timestamp]
        public byte[]? RowVersion { get; set; }
    }

    public class Refund : BaseEntity
    {
        [Key]
        public Guid RefundId { get; set; } = Guid.NewGuid();

        public Guid FolioId { get; set; }
        [ForeignKey("FolioId")]
        public Folio? Folio { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
        public PayMethod RefundMethod { get; set; }
        public RefundStatus Status { get; set; } = RefundStatus.Pending;
        public string? ApprovedBy { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime? ProcessedAt { get; set; }
    }
}
