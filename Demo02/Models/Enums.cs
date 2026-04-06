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
        Technician
    }

    public enum LoyaltyTier
    {
        Silver,
        Gold,
        Platinum,
        Diamond
    }

    public enum HmsTaskType
    {
        Cleaning,
        Turndown,
        Inspection,
        Maintenance,
        Repair
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
}
