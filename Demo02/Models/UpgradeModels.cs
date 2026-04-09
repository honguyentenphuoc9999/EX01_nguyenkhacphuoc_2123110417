using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Demo02.Models
{
    // --- 1. Nhóm Core bổ sung: Giá theo mùa (BRD 8.1) ---
    public class SeasonalPrice : BaseEntity
    {
        [Key]
        public Guid PriceId { get; set; } = Guid.NewGuid();
        public Guid RoomTypeId { get; set; }
        [ForeignKey("RoomTypeId")]
        public RoomType? RoomType { get; set; }

        public string SeasonName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }
    }

    // --- 2. Nhóm HRM bổ sung: Ca làm việc (BRD 8.5) ---
    public class ShiftAssignment : BaseEntity
    {
        [Key]
        public Guid AssignmentId { get; set; } = Guid.NewGuid();
        public Guid StaffId { get; set; }
        [ForeignKey("StaffId")]
        public Staff? Staff { get; set; }

        public DateTime ShiftStart { get; set; }
        public DateTime ShiftEnd { get; set; }
        public string Position { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }

    // --- 3. Nhóm Data Warehouse (Star Schema - BRD 8.6) ---
    public class FactReservation
    {
        [Key]
        public Guid ReservationKey { get; set; }
        public Guid RoomKey { get; set; }
        public Guid GuestKey { get; set; }
        public Guid DateKey { get; set; }
        public string ChannelName { get; set; } = string.Empty;
        [Column(TypeName = "decimal(18,2)")]
        public decimal Revenue { get; set; }
        public int Nights { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal ADR { get; set; }
    }

    public class DimRoom
    {
        [Key]
        public Guid RoomKey { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public int Floor { get; set; }
        public string TypeName { get; set; } = string.Empty;
        [Column(TypeName = "decimal(18,2)")]
        public decimal BasePrice { get; set; }
    }

    public class DimGuest
    {
        [Key]
        public Guid GuestKey { get; set; }
        public string GuestType { get; set; } = string.Empty;
        public string Nationality { get; set; } = string.Empty;
        public string LoyaltyTier { get; set; } = string.Empty;
    }

    // --- 4. Nhóm Features mở rộng (CRM, Logistics, Services, OTA) ---
    public class LoyaltyTransaction : BaseEntity
    {
        [Key]
        public Guid TransactionId { get; set; } = Guid.NewGuid();
        [Column("AccountId")]
        public Guid LoyaltyAccountId { get; set; }
        [ForeignKey("LoyaltyAccountId")]
        public LoyaltyAccount? Account { get; set; }
        public LoyaltyTxType Type { get; set; } = LoyaltyTxType.Earn;
        public int Points { get; set; } 
        public string Description { get; set; } = string.Empty;
        public Guid? ReservationId { get; set; }
        public DateTime TransactionDate { get; set; } = DateTime.Now;
    }

    public class InventoryTransaction : BaseEntity
    {
        [Key]
        public Guid TransactionId { get; set; } = Guid.NewGuid();
        public Guid ItemId { get; set; }
        [ForeignKey("ItemId")]
        public InventoryItem? Item { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal QuantityChanged { get; set; }
        public string Type { get; set; } = "Inbound";
        public string ReferenceNumber { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }

    public class PurchaseOrder : BaseEntity
    {
        [Key]
        public Guid PoId { get; set; } = Guid.NewGuid();
        public string PoNumber { get; set; } = string.Empty;
        public string Supplier { get; set; } = string.Empty;
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime OrderDate { get; set; } = DateTime.Now;
    }

    public class MarketingCampaign : BaseEntity
    {
        [Key]
        public Guid CampaignId { get; set; } = Guid.NewGuid();
        public string CampaignName { get; set; } = string.Empty;
        public MarketingChannel Channel { get; set; } = MarketingChannel.Email;
        public string TargetSegment { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; } = "Draft";
    }

    public class ServiceBooking : BaseEntity
    {
        [Key]
        public Guid BookingId { get; set; } = Guid.NewGuid();
        public Guid? GuestId { get; set; }
        [ForeignKey("GuestId")]
        public Guest? Guest { get; set; }
        public string ServiceType { get; set; } = "Restaurant";
        public string ResourceName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int NumberOfPersons { get; set; }
        public string Status { get; set; } = "Reserved";
        public string SpecialRequests { get; set; } = string.Empty;
    }

    public class OtaConfig : BaseEntity
    {
        [Key]
        public Guid ConfigId { get; set; } = Guid.NewGuid();
        public BookingChannel Channel { get; set; }
        public string ApiKey { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }

    public class OtaSyncLog : BaseEntity
    {
        [Key]
        public Guid LogId { get; set; } = Guid.NewGuid();
        public BookingChannel Channel { get; set; }
        public string Action { get; set; } = "Sync";
        public string ExternalBookingCode { get; set; } = string.Empty;
        public bool IsSuccess { get; set; }
    }
}
