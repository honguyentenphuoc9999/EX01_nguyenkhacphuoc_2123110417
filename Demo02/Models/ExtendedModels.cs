using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Demo02.Models
{
    // --- Nhóm Vận hành (Operations) ---

    public class HousekeepingTask : BaseEntity
    {
        [Key]
        public Guid TaskId { get; set; } = Guid.NewGuid();

        public Guid RoomId { get; set; }
        [ForeignKey("RoomId")]
        public Room? Room { get; set; }

        public Guid? AssignedStaffId { get; set; }
        [ForeignKey("AssignedStaffId")]
        public Staff? AssignedStaff { get; set; }

        public HmsTaskType TaskType { get; set; } = HmsTaskType.Cleaning;
        public HmsTaskStatus Status { get; set; } = HmsTaskStatus.Pending;
        public Priority Priority { get; set; } = Priority.Normal;
        public DateTime ScheduledDate { get; set; } = DateTime.Now;
        public DateTime? CompletedAt { get; set; }
        public string? ProofPhotoUrl { get; set; } // Ảnh chụp bằng chứng sau khi dọn xong
        public string? Notes { get; set; }
        [NotMapped]
        public int ProofPhotoCount { get; set; }
    }

    public class MaintenanceTicket : BaseEntity
    {
        [Key]
        public Guid TicketId { get; set; } = Guid.NewGuid();

        public Guid RoomId { get; set; }
        [ForeignKey("RoomId")]
        public Room? Room { get; set; }

        public string ReportedBy { get; set; } = string.Empty;
        public string IssueDescription { get; set; } = string.Empty;
        public Priority Severity { get; set; } = Priority.Normal;
        public string Status { get; set; } = "Open"; // Open, InProgress, Resolved, Closed
        
        public Guid? AssignedTechnicianId { get; set; }
        [ForeignKey("AssignedTechnicianId")]
        public Staff? AssignedTechnician { get; set; }

        public DateTime? ResolvedAt { get; set; }
        public string? ResolutionNotes { get; set; }
    }

    public class MinibarLog : BaseEntity
    {
        [Key]
        public Guid LogId { get; set; } = Guid.NewGuid();

        public Guid RoomId { get; set; }
        [ForeignKey("RoomId")]
        public Room? Room { get; set; }

        public Guid ReservationId { get; set; }
        [ForeignKey("ReservationId")]
        public Reservation? Reservation { get; set; }

        public Guid ItemId { get; set; }
        [ForeignKey("ItemId")]
        public InventoryItem? Item { get; set; }

        public int QuantityConsumed { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }
        public DateTime LoggedAt { get; set; } = DateTime.Now;
        public bool IsChargedToFolio { get; set; } = false;
    }

    public class LostAndFound : BaseEntity
    {
        [Key]
        public Guid ItemId { get; set; } = Guid.NewGuid();

        public Guid? RoomId { get; set; }
        [ForeignKey("RoomId")]
        public Room? Room { get; set; }

        [Required]
        public string Description { get; set; } = string.Empty;
        public DateTime FoundDate { get; set; } = DateTime.Now;
        public string FoundBy { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Returned, Disposed
    }

    // --- Nhóm Nhân sự (HRM) ---

    public class Staff : BaseEntity
    {
        [Key]
        public Guid StaffId { get; set; } = Guid.NewGuid();
        [StringLength(20)]
        public string EmployeeCode { get; set; } = string.Empty;
        [Required, StringLength(200)]
        public string FullName { get; set; } = string.Empty;
        public Department Department { get; set; } = Department.FrontDesk;
        public string Position { get; set; } = string.Empty;
        public ContractType ContractType { get; set; } = ContractType.FullTime;

        [Required, StringLength(100)]
        public string Email { get; set; } = string.Empty;
        [StringLength(20)]
        public string Phone { get; set; } = string.Empty;
        public StaffRole Role { get; set; } = StaffRole.Receptionist;
        public DateTime HireDate { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal BaseSalary { get; set; }

        public virtual ICollection<ShiftAssignment> ShiftAssignments { get; set; } = new List<ShiftAssignment>();
    }

    // --- Nhóm CRM & Loyalty ---

    public class LoyaltyAccount : BaseEntity
    {
        [Key]
        public Guid AccountId { get; set; } = Guid.NewGuid();

        public Guid GuestId { get; set; }
        [ForeignKey("GuestId")]
        public Guest? Guest { get; set; }

        [Required, StringLength(20)]
        public string MemberNumber { get; set; } = string.Empty;
        public LoyaltyTier Tier { get; set; } = LoyaltyTier.Silver;
        public long CurrentPoints { get; set; }
        public long LifetimePoints { get; set; }
        public DateTime EnrolledAt { get; set; } = DateTime.Now;
    }

    // --- Nhóm Kho (Logistics) ---

    public class InventoryItem : BaseEntity
    {
        [Key]
        public Guid ItemId { get; set; } = Guid.NewGuid();

        [Required, StringLength(30)]
        public string ItemCode { get; set; } = string.Empty;
        [Required, StringLength(200)]
        public string ItemName { get; set; } = string.Empty;
        public ItemCategory Category { get; set; } = ItemCategory.Other;
        public string Unit { get; set; } = string.Empty; // cái, chai, kg...
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal CurrentStock { get; set; }
        [Column(TypeName = "decimal(10,2)")]
        public decimal MinimumStock { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitCost { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal SellingPrice { get; set; } // Giá bán cho khách

        public bool IsForSale { get; set; } = false; // Có hiển thị lên menu gọi món không?
    }

    // --- Nhóm Room Service (F&B) ---
    public class RoomServiceOrder : BaseEntity
    {
        [Key]
        public Guid OrderId { get; set; } = Guid.NewGuid();

        public Guid ReservationId { get; set; }
        [ForeignKey("ReservationId")]
        public Reservation? Reservation { get; set; }

        public Guid RoomId { get; set; }
        [ForeignKey("RoomId")]
        public Room? Room { get; set; }

        [Required]
        public string OrderItems { get; set; } = string.Empty; // Danh sách món dạng JSON hoặc Text
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }
        
        public string Status { get; set; } = "Pending"; // Pending, Preparing, Delivering, Completed, Cancelled
        
        public Guid? AssignedStaffId { get; set; } // Nhân viên phục vụ phòng (Room Attendant)
        [ForeignKey("AssignedStaffId")]
        public Staff? AssignedStaff { get; set; }

        public bool IsPaid { get; set; } = false; // Đã thanh toán (Cộng vào hóa đơn hay chưa)
        public string? Notes { get; set; }
    }
}
