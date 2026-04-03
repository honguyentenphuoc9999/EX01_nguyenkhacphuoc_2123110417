using System;
using System.Threading.Tasks;
using Demo02.Models;

namespace Demo02.Data.Repositories
{
    public interface IUnitOfWork : IDisposable
    {
        IGenericRepository<Room> Rooms { get; }
        IGenericRepository<RoomType> RoomTypes { get; }
        IGenericRepository<Reservation> Reservations { get; }
        IGenericRepository<Guest> Guests { get; }
        IGenericRepository<Folio> Folios { get; }
        IGenericRepository<FolioCharge> FolioCharges { get; }
        IGenericRepository<Invoice> Invoices { get; }
        IGenericRepository<LostAndFound> LostAndFounds { get; }
        IGenericRepository<GuestDocument> GuestDocuments { get; }
        IGenericRepository<HousekeepingTask> HousekeepingTasks { get; }
        IGenericRepository<Staff> Staffs { get; }
        IGenericRepository<LoyaltyAccount> LoyaltyAccounts { get; }
        IGenericRepository<InventoryItem> InventoryItems { get; }
        IGenericRepository<MinibarLog> MinibarLogs { get; }
        IGenericRepository<Refund> Refunds { get; }
        IGenericRepository<ReservationRoom> ReservationRooms { get; }
        // Add other repositories as needed
        
        Task<int> CompleteAsync();
    }
}
