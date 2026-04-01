using Demo02.Models;
using Microsoft.EntityFrameworkCore;

namespace Demo02.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // --- Nhóm Core: Lễ tân & Đặt phòng (UC-01 to UC-07, BK-01 to BK-03) ---
    public DbSet<RoomType> RoomTypes { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<Guest> Guests { get; set; }
    public DbSet<GuestDocument> GuestDocuments { get; set; }
    public DbSet<Reservation> Reservations { get; set; }
    public DbSet<ReservationRoom> ReservationRooms { get; set; }

    // --- Nhóm Vận hành: Buồng phòng & Kỹ thuật (UC-08 to UC-12, OPS-01 to OPS-04) ---
    public DbSet<HousekeepingTask> HousekeepingTasks { get; set; }
    public DbSet<MaintenanceTicket> MaintenanceTickets { get; set; }
    public DbSet<MinibarLog> MinibarLogs { get; set; }
    public DbSet<LostAndFound> LostAndFounds { get; set; }

    // --- Nhóm Tài chính: Thanh toán & Thu hút (UC-13 to UC-17, FIN-01 to FIN-03) ---
    public DbSet<Folio> Folios { get; set; }
    public DbSet<FolioCharge> FolioCharges { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<Refund> Refunds { get; set; }

    // --- Nhóm Bổ trợ: CRM, Nhân sự, Kho (UC-18 to UC-28, ADM-01 to ADM-03) ---
    public DbSet<Staff> Staffs { get; set; }
    public DbSet<LoyaltyAccount> LoyaltyAccounts { get; set; }
    public DbSet<InventoryItem> InventoryItems { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --- Cài đặt Global Query Filter cho tất cả thực thể Nghiệp vụ (Soft Delete - BR 14) ---
        modelBuilder.Entity<RoomType>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Room>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Guest>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<GuestDocument>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Reservation>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<ReservationRoom>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Folio>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<FolioCharge>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Payment>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Invoice>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Refund>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<HousekeepingTask>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<MaintenanceTicket>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<MinibarLog>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<LostAndFound>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Staff>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<LoyaltyAccount>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<InventoryItem>().HasQueryFilter(x => !x.IsDeleted);

        // --- Cài đặt khóa duy nhất (Unique Constraints) ---
        modelBuilder.Entity<Room>().HasIndex(r => r.RoomNumber).IsUnique();
        modelBuilder.Entity<Reservation>().HasIndex(r => r.BookingCode).IsUnique();
        modelBuilder.Entity<Staff>().HasIndex(s => s.EmployeeCode).IsUnique();
        modelBuilder.Entity<InventoryItem>().HasIndex(i => i.ItemCode).IsUnique();
        modelBuilder.Entity<Invoice>().HasIndex(inv => inv.InvoiceNumber).IsUnique();
    }

    // --- Ghi đè phương thức SaveChanges để tự động xử lý Audit Fields & Soft Delete ---
    public override int SaveChanges()
    {
        HandleAuditFields();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        HandleAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void HandleAuditFields()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is BaseEntity && (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted));

        foreach (var entityEntry in entries)
        {
            var entity = (BaseEntity)entityEntry.Entity;
            if (entityEntry.State == EntityState.Added)
            {
                entity.CreatedAt = DateTime.Now;
            }
            else if (entityEntry.State == EntityState.Modified)
            {
                entity.UpdatedAt = DateTime.Now;
            }
            else if (entityEntry.State == EntityState.Deleted)
            {
                entityEntry.State = EntityState.Modified; // Chuyển Hard Delete -> Soft Delete
                entity.IsDeleted = true;
                entity.DeletedAt = DateTime.Now;
            }
        }
    }
}