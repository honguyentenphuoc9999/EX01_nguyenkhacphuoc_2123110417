using System.ComponentModel.DataAnnotations;

namespace Demo02.Models
{
    public class SystemSettings
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string BankName { get; set; } = "MBBank";

        [Required]
        [StringLength(50)]
        public string AccountNumber { get; set; } = "123456789";

        [Required]
        [StringLength(100)]
        public string AccountHolder { get; set; } = "HOTEL ROYAL ADMIN";

        public string? HotelLogoUrl { get; set; }
        public string? HotelAddress { get; set; }
        public string? HotelPhone { get; set; }
    }
}
