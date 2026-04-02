namespace Demo02.Models
{
    public enum RoomStatus
    {
        VacantClean,
        VacantDirty,
        Occupied,
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
        VIP,
        Corporate,
        Regular,
        Group
    }

    public enum StaffRole
    {
        Admin,
        Receptionist,
        Housekeeper,
        Accountant,
        Technician
    }
}
