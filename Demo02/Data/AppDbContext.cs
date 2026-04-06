using Demo02.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Demo02.Utilities;

namespace Demo02.Data;

public class AppDbContext : IdentityDbContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor httpContextAccessor) : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
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
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<SystemSettings> SystemSettings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // HMS Rule: Tư động lọc bỏ dữ liệu đã xóa (Soft Delete) toàn hệ thống
        modelBuilder.Entity<Room>().HasQueryFilter(r => !r.IsDeleted);
        modelBuilder.Entity<Guest>().HasQueryFilter(g => !g.IsDeleted);
        modelBuilder.Entity<Reservation>().HasQueryFilter(r => !r.IsDeleted);
        modelBuilder.Entity<Folio>().HasQueryFilter(f => !f.IsDeleted);
        modelBuilder.Entity<Invoice>().HasQueryFilter(i => !i.IsDeleted);
        modelBuilder.Entity<Staff>().HasQueryFilter(s => !s.IsDeleted);
        modelBuilder.Entity<LoyaltyAccount>().HasQueryFilter(l => !l.IsDeleted);

        // Cấu hình Quan hệ 1-1 cho LoyaltyAccount nếu cần
        modelBuilder.Entity<LoyaltyAccount>()
            .HasIndex(l => l.GuestId)
            .IsUnique();

        // --- NFR-05: AES-256 Encryption for PII Data (CCCD/Passport) ---
        var encryptionConverter = new ValueConverter<string, string>(
            v => EncryptionHelper.Encrypt(v),
            v => EncryptionHelper.Decrypt(v));

        modelBuilder.Entity<Guest>()
            .Property(g => g.IdNumber)
            .HasConversion(encryptionConverter);

        // --- Cài đặt Global Query Filter cho tất cả thực thể Nghiệp vụ (Soft Delete - BR 14) ---
        modelBuilder.Entity<RoomType>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<GuestDocument>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<ReservationRoom>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<FolioCharge>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Payment>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Refund>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<HousekeepingTask>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<MaintenanceTicket>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<MinibarLog>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<LostAndFound>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<InventoryItem>().HasQueryFilter(x => !x.IsDeleted);

        // --- Cài đặt khóa duy nhất (Unique Constraints) ---
        modelBuilder.Entity<Room>().HasIndex(r => r.RoomNumber).IsUnique();
        modelBuilder.Entity<Reservation>().HasIndex(r => r.BookingCode).IsUnique();
        modelBuilder.Entity<Staff>().HasIndex(s => s.EmployeeCode).IsUnique();
        modelBuilder.Entity<InventoryItem>().HasIndex(i => i.ItemCode).IsUnique();
        modelBuilder.Entity<Invoice>().HasIndex(inv => inv.InvoiceNumber).IsUnique();

        // --- NFR-10: Tránh lặp xóa dây chuyền (Fix Multiple Cascade Paths for SQL Server) ---
        modelBuilder.Entity<MinibarLog>()
            .HasOne(m => m.Room)
            .WithMany()
            .HasForeignKey(m => m.RoomId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<MinibarLog>()
            .HasOne(m => m.Reservation)
            .WithMany()
            .HasForeignKey(m => m.ReservationId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<HousekeepingTask>()
            .HasOne(h => h.Room)
            .WithMany()
            .HasForeignKey(h => h.RoomId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<MaintenanceTicket>()
            .HasOne(m => m.Room)
            .WithMany()
            .HasForeignKey(m => m.RoomId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Folio>()
            .HasOne(f => f.Reservation)
            .WithMany()
            .HasForeignKey(f => f.ReservationId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<ReservationRoom>()
            .HasOne(rr => rr.Reservation)
            .WithMany(r => r.ReservationRooms)
            .HasForeignKey(rr => rr.ReservationId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<ReservationRoom>()
            .HasOne(rr => rr.RoomType)
            .WithMany()
            .HasForeignKey(rr => rr.RoomTypeId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<FolioCharge>()
            .HasOne(fc => fc.Folio)
            .WithMany(f => f.Charges)
            .HasForeignKey(fc => fc.FolioId)
            .OnDelete(DeleteBehavior.NoAction);
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
            .Where(e => e.Entity is BaseEntity && (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted))
            .ToList();

        // Lấy tên User đang đăng nhập từ HttpContext (BRD BR-17)
        var currentUserName = _httpContextAccessor.HttpContext?.User?.Identity?.Name ?? "System";

        foreach (var entityEntry in entries)
        {
            var entity = (BaseEntity)entityEntry.Entity;
            string action = "";
            
            if (entityEntry.State == EntityState.Added)
            {
                entity.CreatedAt = DateTime.Now;
                entity.CreatedBy = currentUserName;
                action = "Create";
            }
            else if (entityEntry.State == EntityState.Modified)
            {
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = currentUserName;
                action = "Update";
            }
            else if (entityEntry.State == EntityState.Deleted)
            {
                entityEntry.State = EntityState.Modified; // Chuyển Hard Delete -> Soft Delete
                entity.IsDeleted = true;
                entity.DeletedAt = DateTime.Now;
                entity.UpdatedBy = currentUserName;
                action = "Delete";
            }

            // --- BR-17: Audit Trail Logging ---
            var log = new AuditLog
            {
                EntityName = entity.GetType().Name,
                EntityId = entity.GetType().GetProperties().FirstOrDefault(p => p.Name.EndsWith("Id"))?.GetValue(entity)?.ToString() ?? "Unknown",
                Action = action,
                Timestamp = DateTime.Now,
                UserId = currentUserName
            };
            AuditLogs.Add(log);
        }
    }
}