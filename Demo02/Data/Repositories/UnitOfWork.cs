using System;
using System.Threading.Tasks;
using Demo02.Models;

namespace Demo02.Data.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;

        public UnitOfWork(AppDbContext context)
        {
            _context = context;
            Rooms = new GenericRepository<Room>(_context);
            RoomTypes = new GenericRepository<RoomType>(_context);
            Reservations = new GenericRepository<Reservation>(_context);
            Guests = new GenericRepository<Guest>(_context);
            Folios = new GenericRepository<Folio>(_context);
            FolioCharges = new GenericRepository<FolioCharge>(_context);
            Invoices = new GenericRepository<Invoice>(_context);
            LostAndFounds = new GenericRepository<LostAndFound>(_context);
            GuestDocuments = new GenericRepository<GuestDocument>(_context);
            HousekeepingTasks = new GenericRepository<HousekeepingTask>(_context);
            Staffs = new GenericRepository<Staff>(_context);
        }

        public IGenericRepository<Room> Rooms { get; private set; }
        public IGenericRepository<RoomType> RoomTypes { get; private set; }
        public IGenericRepository<Reservation> Reservations { get; private set; }
        public IGenericRepository<Guest> Guests { get; private set; }
        public IGenericRepository<Folio> Folios { get; private set; }
        public IGenericRepository<FolioCharge> FolioCharges { get; private set; }
        public IGenericRepository<Invoice> Invoices { get; private set; }
        public IGenericRepository<LostAndFound> LostAndFounds { get; private set; }
        public IGenericRepository<GuestDocument> GuestDocuments { get; private set; }
        public IGenericRepository<HousekeepingTask> HousekeepingTasks { get; private set; }
        public IGenericRepository<Staff> Staffs { get; private set; }

        public async Task<int> CompleteAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
