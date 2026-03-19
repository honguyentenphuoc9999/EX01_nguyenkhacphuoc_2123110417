using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Demo02.Models
{
    public class FolioCharge : BaseEntity
    {
        [Key]
        public Guid ChargeId { get; set; } = Guid.NewGuid();

        public Guid FolioId { get; set; }
        [ForeignKey("FolioId")]
        public Folio? Folio { get; set; }

        [Required]
        public string ChargeType { get; set; } = string.Empty;
        [Required, StringLength(200)]
        public string Description { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Quantity { get; set; } = 1;
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public DateTime ChargedAt { get; set; }
        public string ChargedBy { get; set; } = string.Empty;
    }
}
