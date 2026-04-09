namespace Demo02.Models
{
    public enum RoomStatus
    {
        VacantClean,
        VacantDirty,
        Occupied,
        Reserved,
        OutOfOrder,
        UnderMaintenance
    }

    public enum ReservationStatus
    {
        Pending,
        Confirmed,
        CheckedIn,
        CheckedOut,
        Cancelled,
        NoShow
    }

    public enum BookingChannel
    {
        Direct,
        OTA,
        WalkIn,
        Group,
        Corporate
    }

    public enum FolioStatus
    {
        Open,
        Closed,
        Settled
    }

    public enum ChargeType
    {
        Room,
        Minibar,
        Service,
        Surcharge,
        Discount
    }

    public enum PayMethod
    {
        Cash,
        CreditCard,
        BankTransfer,
        EWallet,
        Debt
    }

    public enum InvoiceStatus
    {
        Draft,
        Issued,
        Paid,
        Cancelled
    }

    public enum RefundStatus
    {
        Pending,
        Approved,
        Completed,
        Rejected
    }

    public enum GuestType
    {
        Regular,
        VIP,
        Corporate,
        Member,
        Group
    }

    public enum StaffRole
    {
        Admin,
        Manager,
        Receptionist,
        Housekeeper,
        Accountant,
        Technician,
        RoomAttendant // Mới: Nhân viên Phục vụ phòng (Service)
    }

    public enum LoyaltyTier
    {
        Bronze,     // 0-999
        Silver,     // 1,000-2,999
        Gold,       // 3,000-9,999
        Platinum,   // 10,000-24,999
        Diamond,    // 25,000-49,999
        Royal       // 50,000+
    }

    public enum HmsTaskType
    {
        Cleaning,
        Turndown,
        Inspection,
        Maintenance,
        Repair,
        Delivery // Mới: Giao đồ theo yêu cầu khách (Dành cho Room Attendant)
    }

    public enum HmsTaskStatus
    {
        Pending,
        InProgress,
        UnderReview, // Mới: Chờ quản lý xem ảnh và duyệt
        Completed,
        Cancelled
    }

    public enum Priority
    {
        Low,
        Normal,
        High,
        Critical
    }

    // --- Enums bổ sung theo BRD 8.7 ---
    public enum LoyaltyTxType
    {
        Earn, 
        Redeem, 
        Expire, 
        Adjustment
    }

    public enum ItemCategory
    {
        Minibar, 
        Amenity, 
        Linen, 
        Cleaning, 
        Maintenance, 
        Other
    }

    public enum Department
    {
        FrontDesk, 
        Housekeeping, 
        FB, 
        Finance, 
        Technical, 
        HR, 
        Management
    }

    public enum ContractType
    {
        FullTime, 
        PartTime, 
        Seasonal
    }

    public enum MarketingChannel
    {
        Email, 
        SMS, 
        AppNotification
    }
}
