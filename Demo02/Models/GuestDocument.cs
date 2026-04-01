using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Demo02.Models
{
    public class GuestDocument : BaseEntity
    {
        [Key]
        public Guid DocumentId { get; set; } = Guid.NewGuid();

        public Guid GuestId { get; set; }
        [ForeignKey("GuestId")]
        public Guest? Guest { get; set; }

        [Required]
        public string DocumentType { get; set; } = "IDCard"; // IDCard, Passport, Visa...
        [Required, StringLength(500)]
        public string DocumentUrl { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; } = DateTime.Now;
    }
}
