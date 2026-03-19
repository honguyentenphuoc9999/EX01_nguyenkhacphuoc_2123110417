using Demo02.Models;
using Microsoft.EntityFrameworkCore;

namespace Demo02.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Nhóm Đặt phòng
    public DbSet<RoomType> RoomTypes { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<Guest> Guests { get; set; }
    public DbSet<Reservation> Reservations { get; set; }

    // Nhóm Tài chính
    public DbSet<Folio> Folios { get; set; }
    public DbSet<FolioCharge> FolioCharges { get; set; }
    // public DbSet<Invoice> Invoices { get; set; }
    // public DbSet<Refund> Refunds { get; set; }

    // Ghi đè phương thức SaveChanges để tự động xử lý BaseEntity (Ngày tạo, cập nhật)
    public override int SaveChanges()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is BaseEntity && (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entityEntry in entries)
        {
            var entity = (BaseEntity)entityEntry.Entity;
            if (entityEntry.State == EntityState.Added)
            {
                entity.CreatedAt = DateTime.Now;
            }
            else
            {
                entity.UpdatedAt = DateTime.Now;
            }
        }
        return base.SaveChanges();
    }
}