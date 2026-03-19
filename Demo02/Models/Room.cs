using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Demo02.Models
{
    public class Room:BaseEntity
    {
        [Key]
        public Guid RoomId { get; set; } = Guid.NewGuid();
        [Required, StringLength(10)]
        public string RoomNumber { get; set; } = string.Empty;
        public int Floor { get; set; }

        public Guid RoomTypeId { get; set; }
        [ForeignKey("RoomTypeId")]
        public RoomType? RoomType { get; set; }

        [Required]
        public string Status { get; set; } = "Sạch sẵn sàng";
        [Column(TypeName = "decimal(18,2)")]
        public decimal BasePrice { get; set; }
        [StringLength(500)]
        public string? Description { get; set; }

        [Timestamp] // Ngăn chặn xung đột dữ liệu đồng thời theo yêu cầu BRD
        public byte[]? RowVersion { get; set; }
    }
}
