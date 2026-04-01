using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Demo02.Models
{
    public class ReservationRoom : BaseEntity
    {
        [Key]
        public Guid DetailId { get; set; } = Guid.NewGuid();

        public Guid ReservationId { get; set; }
        [ForeignKey("ReservationId")]
        public Reservation? Reservation { get; set; }

        public Guid RoomTypeId { get; set; }
        [ForeignKey("RoomTypeId")]
        public RoomType? RoomType { get; set; }

        public Guid? RoomId { get; set; }
        [ForeignKey("RoomId")]
        public Room? Room { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal RoomRate { get; set; }
        public int Adults { get; set; } = 1;
        public int Children { get; set; } = 0;
    }
}
