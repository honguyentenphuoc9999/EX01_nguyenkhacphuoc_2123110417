using Demo02.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Demo02.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext context, UserManager<IdentityUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            // 1. Seed Roles
            string[] roles = { "Admin", "Manager", "Receptionist", "Housekeeper", "Technician" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // 2. Seed Admin User & Staff Profile
            var adminEmail = "admin@hms.com";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new IdentityUser { UserName = "admin_phuoc", Email = adminEmail, EmailConfirmed = true };
                await userManager.CreateAsync(adminUser, "Admin@123");
                await userManager.AddToRoleAsync(adminUser, "Admin");

                // Tạo hồ sơ nhân sự tương ứng (Sync)
                if (!context.Staffs.Any(s => s.Email == adminEmail))
                {
                    context.Staffs.Add(new Staff
                    {
                        EmployeeCode = "NV001",
                        FullName = "Nguyễn Khắc Phước",
                        Email = adminEmail,
                        Phone = "0901234567",
                        Role = StaffRole.Admin,
                        Department = "Management",
                        Position = "CEO",
                        HireDate = DateTime.Now,
                        BaseSalary = 5000,
                        CreatedAt = DateTime.Now,
                        CreatedBy = "System"
                    });
                }
            }

            // 3. Seed Staff for All Departments
            var staffList = new List<(string Name, string Email, string Code, StaffRole Role, string Dept, string Pos)>
            {
                ("Trần Văn Quản", "manager@hms.com", "NV002", StaffRole.Manager, "Management", "Hotel Manager"),
                ("Nguyễn Thị Lan", "lan@hms.com", "NV003", StaffRole.Receptionist, "FrontDesk", "Receptionist"),
                ("Lê Văn Nam", "nam@hms.com", "NV004", StaffRole.Housekeeper, "Housekeeping", "Room Attendant"),
                ("Phạm Minh Kế", "ke@hms.com", "NV005", StaffRole.Accountant, "Finance", "Accountant"),
                ("Võ Văn Kỹ", "ky@hms.com", "NV006", StaffRole.Technician, "Maintenance", "Technician")
            };

            foreach (var s in staffList)
            {
                if (!context.Staffs.Any(staff => staff.EmployeeCode == s.Code))
                {
                    // Tạo tài khoản đăng nhập (Identity)
                    var user = await userManager.FindByEmailAsync(s.Email);
                    if (user == null)
                    {
                        user = new IdentityUser { UserName = s.Email.Split('@')[0], Email = s.Email, EmailConfirmed = true };
                        await userManager.CreateAsync(user, "Staff@123");
                        
                        // Gán quyền tương ứng (Map StaffRole sang IdentityRole)
                        string roleName = s.Role.ToString();
                        if (await roleManager.RoleExistsAsync(roleName))
                        {
                            await userManager.AddToRoleAsync(user, roleName);
                        }
                    }

                    // Tạo hồ sơ nhân sự (Staff Profile)
                    context.Staffs.Add(new Staff
                    {
                        EmployeeCode = s.Code,
                        FullName = s.Name,
                        Email = s.Email,
                        Phone = "090" + new Random().Next(1000000, 9999999),
                        Role = s.Role,
                        Department = s.Dept,
                        Position = s.Pos,
                        HireDate = DateTime.Now.AddMonths(-new Random().Next(1, 24)),
                        BaseSalary = 1000 + new Random().Next(200, 2000),
                        CreatedAt = DateTime.Now,
                        CreatedBy = "System"
                    });
                }
            }

            // 4. Seed Room Types
            if (!context.RoomTypes.Any())
            {
                var types = new List<RoomType>
                {
                    new RoomType { TypeName = "Standard Room", BasePrice = 500000, MaxOccupancy = 2, AreaSqm = 25, Description = "Phòng tiêu chuẩn đầy đủ tiện nghi", Amenities = "Wifi, TV, Điều hòa", CreatedBy = "System" },
                    new RoomType { TypeName = "Deluxe Room", BasePrice = 850000, MaxOccupancy = 2, AreaSqm = 35, Description = "Phòng sang trọng view thành phố", Amenities = "Wifi, TV, Minibar, Bồn tắm", CreatedBy = "System" },
                    new RoomType { TypeName = "Executive Suite", BasePrice = 1500000, MaxOccupancy = 3, AreaSqm = 55, Description = "Phòng tổng thống cực kỳ cao cấp", Amenities = "Wifi, TV 4K, Jacuzzi, Ban công", CreatedBy = "System" }
                };
                context.RoomTypes.AddRange(types);
                await context.SaveChangesAsync(); // Lưu để lấy ID cho bước tiếp theo
            }

            // 5. Seed Rooms (Bổ sung phòng còn thiếu)
            var stdType = await context.RoomTypes.FirstAsync(t => t.TypeName == "Standard Room");
            var dlxType = await context.RoomTypes.FirstAsync(t => t.TypeName == "Deluxe Room");
            var suiteType = await context.RoomTypes.FirstAsync(t => t.TypeName == "Executive Suite");

            var roomsToSeed = new List<Room>
            {
                new Room { RoomNumber = "101", Floor = 1, RoomTypeId = stdType.RoomTypeId, Status = RoomStatus.VacantClean, BasePrice = 500000, CreatedBy = "System" },
                new Room { RoomNumber = "102", Floor = 1, RoomTypeId = stdType.RoomTypeId, Status = RoomStatus.VacantClean, BasePrice = 500000, CreatedBy = "System" },
                new Room { RoomNumber = "201", Floor = 2, RoomTypeId = dlxType.RoomTypeId, Status = RoomStatus.VacantClean, BasePrice = 850000, CreatedBy = "System" },
                new Room { RoomNumber = "202", Floor = 2, RoomTypeId = dlxType.RoomTypeId, Status = RoomStatus.VacantDirty, BasePrice = 850000, CreatedBy = "System" },
                new Room { RoomNumber = "301", Floor = 3, RoomTypeId = suiteType.RoomTypeId, Status = RoomStatus.VacantClean, BasePrice = 1500000, CreatedBy = "System" },
                new Room { RoomNumber = "302", Floor = 3, RoomTypeId = suiteType.RoomTypeId, Status = RoomStatus.VacantClean, BasePrice = 1500000, CreatedBy = "System" }
            };

            foreach (var r in roomsToSeed)
            {
                if (!await context.Rooms.AnyAsync(existing => existing.RoomNumber == r.RoomNumber))
                {
                    context.Rooms.Add(r);
                }
            }
            await context.SaveChangesAsync();

            // 6. Seed Inventory
            if (!context.InventoryItems.Any())
            {
                context.InventoryItems.AddRange(new List<InventoryItem>
                {
                    new InventoryItem { ItemCode = "INV-001", ItemName = "Coca Cola", Category = "Minibar", Unit = "Lon", CurrentStock = 100, MinimumStock = 20, CreatedBy = "System" },
                    new InventoryItem { ItemCode = "INV-002", ItemName = "Nước suối", Category = "Minibar", Unit = "Chai", CurrentStock = 200, MinimumStock = 50, CreatedBy = "System" },
                    new InventoryItem { ItemCode = "INV-003", ItemName = "Khăn tắm", Category = "Linen", Unit = "Cái", CurrentStock = 50, MinimumStock = 10, CreatedBy = "System" }
                });
            }

            await context.SaveChangesAsync();
        }
    }
}
