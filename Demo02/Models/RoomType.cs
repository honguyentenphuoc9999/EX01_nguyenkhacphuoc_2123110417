using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Demo02.Models
{
    public class RoomType : BaseEntity
    {
        [Key]
        public Guid RoomTypeId { get; set; } = Guid.NewGuid();
        [Required, StringLength(50)]
        public string TypeName { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal BasePrice { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public int MaxOccupancy { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal AreaSqm { get; set; }
        public string? Amenities { get; set; }
        public string? SeasonalPrices { get; set; } // Dạng JSON string

        public string? ImageUrl { get; set; } // Link ảnh Cloudinary (1 ảnh)
        public ICollection<Room>? Rooms { get; set; }
    }
}
