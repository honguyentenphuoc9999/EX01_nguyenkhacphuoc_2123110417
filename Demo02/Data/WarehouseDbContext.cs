using Demo02.Models;
using Microsoft.EntityFrameworkCore;

namespace Demo02.Data
{
    // --- Bắt buộc theo mục 4.3 của BRD: Tách biệt dữ liệu Warehouse (OLAP) ---
    public class WarehouseDbContext : DbContext
    {
        public WarehouseDbContext(DbContextOptions<WarehouseDbContext> options) : base(options) { }

        public DbSet<FactReservation> FactReservations { get; set; }
        public DbSet<DimRoom> DimRooms { get; set; }
        public DbSet<DimGuest> DimGuests { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // --- Cấu hình độ chính xác Decimal cho báo cáo phân tích ---
            foreach (var property in modelBuilder.Model.GetEntityTypes()
                .SelectMany(t => t.GetProperties())
                .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetPrecision(18);
                property.SetScale(2);
            }

            modelBuilder.Entity<FactReservation>().HasKey(f => f.ReservationKey);
            modelBuilder.Entity<DimRoom>().HasKey(d => d.RoomKey);
            modelBuilder.Entity<DimGuest>().HasKey(d => d.GuestKey);
        }
    }
}
