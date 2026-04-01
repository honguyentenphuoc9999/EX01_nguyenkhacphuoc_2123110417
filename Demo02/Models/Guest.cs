using System.ComponentModel.DataAnnotations;

namespace Demo02.Models
{
    public class Guest:BaseEntity
    {
        [Key]
        public Guid GuestId { get; set; } = Guid.NewGuid();
        
        [Required, StringLength(200)]
        public string FullName { get; set; } = string.Empty;
        
        [Required, StringLength(20)]
        public string IdNumber { get; set; } = string.Empty;
        
        [Required, StringLength(50)]
        public string Nationality { get; set; } = string.Empty;
        
        public DateTime DateOfBirth { get; set; }
        
        [Required, StringLength(20)]
        public string Phone { get; set; } = string.Empty;
        
        [StringLength(200)]
        public string? Email { get; set; }
        
        public GuestType GuestType { get; set; } = GuestType.Regular;
        
        public Guid? LoyaltyAccountId { get; set; }
        
        [StringLength(1000)]
        public string? Preferences { get; set; }

        public ICollection<Reservation>? Reservations { get; set; }
        public ICollection<GuestDocument>? GuestDocuments { get; set; }
    }
}
