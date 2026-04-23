using System.ComponentModel.DataAnnotations;
using Demo02.Models;

namespace Demo02.Models.DTOs
{
    // --- Room DTOs (NFR-13) ---
    public class RoomResponseDto
    {
        public Guid RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public int Floor { get; set; }
        public string RoomTypeName { get; set; } = string.Empty;
        public Guid RoomTypeId { get; set; }
        public RoomStatus Status { get; set; }
        public decimal BasePrice { get; set; }
        public string? ImageUrls { get; set; }
    }

    public class RoomCreateDto
    {
        [Required, StringLength(10)]
        public string RoomNumber { get; set; } = string.Empty;
        public int Floor { get; set; }
        public Guid RoomTypeId { get; set; }
        public decimal BasePrice { get; set; }
        public string? ImageUrls { get; set; }
    }

    public class RoomTypeResponseDto
    {
        public Guid RoomTypeId { get; set; }
        public string TypeName { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public string? Description { get; set; }
        public int MaxOccupancy { get; set; }
        public int RoomCount { get; set; }
        public int AvailableRooms { get; set; }
        public string? ImageUrl { get; set; }
    }

    // --- Guest DTOs (BRD Rule PI) ---
    public class GuestResponseDto
    {
        public Guid GuestId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Nationality { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string IdNumber { get; set; } = string.Empty; // PII Data (Exposed for Authorized Admin only)
        public GuestType GuestType { get; set; }
        public bool IsVerified { get; set; }
        public string? Preferences { get; set; } // 🛡️ Smart Sync: Thêm sở thích khách hàng lên Admin UI
    }

    public class GuestCreateDto
    {
        [Required, StringLength(200)]
        public string FullName { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Số CCCD là bắt buộc.")]
        [RegularExpression(@"^\d{12}$", ErrorMessage = "Số CCCD phải bao gồm đúng 12 chữ số và không chứa chữ cái.")]
        public string IdNumber { get; set; } = string.Empty; // CCCD / Passport
        
        [EmailAddress]
        public string? Email { get; set; }
        
        [Phone]
        public string Phone { get; set; } = string.Empty;

        [StringLength(100)]
        public string Nationality { get; set; } = "Vietnam";
    }
}
