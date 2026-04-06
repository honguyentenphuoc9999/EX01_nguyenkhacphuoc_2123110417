using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Demo02.Data;

namespace Demo02.Data
{
    public static class DbRepair
    {
        public static async Task FixGuestPhoneAsync(AppDbContext context)
        {
            // HMS Rule: Ép cơ sở dữ liệu phải liên kết SĐT cho tài khoản mẫu
            var user = await context.Users.FirstOrDefaultAsync(u => u.Email == "member@gmail.com");
            if (user != null)
            {
                user.PhoneNumber = "0909000123";
                user.UserName = "0909000123"; // 🛡️ Ép Username là SĐT để đăng nhập mượt mà nhất
                user.NormalizedUserName = "0909000123";
                await context.SaveChangesAsync();
                Console.WriteLine("HMS REPAIR: Đã ép Số điện thoại và Username về 0909000123 cho Nguyễn Thành Viên thành công!");
            }
        }

        public static async Task FixRoomStatusesAsync(AppDbContext context)
        {
            // Sync all rooms that belong to checked-in reservations to be 'Occupied' (2)
            var activeReservations = await context.Reservations
                .Include(r => r.ReservationRooms)
                .Where(r => r.Status == Demo02.Models.ReservationStatus.CheckedIn && !r.IsDeleted)
                .ToListAsync();

            int fixedCount = 0;
            foreach (var r in activeReservations)
            {
                if (r.RoomId.HasValue)
                {
                    var room = await context.Rooms.FindAsync(r.RoomId.Value);
                    if (room != null && room.Status != Demo02.Models.RoomStatus.Occupied)
                    {
                        room.Status = Demo02.Models.RoomStatus.Occupied;
                        fixedCount++;
                    }
                }
                
                if (r.ReservationRooms != null)
                {
                    foreach (var rr in r.ReservationRooms)
                    {
                        if (rr.RoomId.HasValue)
                        {
                            var room = await context.Rooms.FindAsync(rr.RoomId.Value);
                            if (room != null && room.Status != Demo02.Models.RoomStatus.Occupied)
                            {
                                room.Status = Demo02.Models.RoomStatus.Occupied;
                                fixedCount++;
                            }
                        }
                    }
                }
            }

            if (fixedCount > 0)
            {
                await context.SaveChangesAsync();
                Console.WriteLine($"HMS REPAIR: Đã đồng bộ trạng thái Occupied cho {fixedCount} phòng đang có khách ở nhưng bị lỗi Trống!");
            }
        }
    }
}
