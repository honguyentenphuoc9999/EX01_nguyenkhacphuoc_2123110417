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
            try {
                // HMS Rule: Đảm bảo bảng Guests có đủ cột HomeAddress để trích xuất QR CCCD
                await context.Database.ExecuteSqlRawAsync("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Guests]') AND name = 'HomeAddress') ALTER TABLE [dbo].[Guests] ADD HomeAddress nvarchar(max) NULL;");
                
                // HMS Rule: Thêm cột QR Code vào Hóa đơn để hỗ trợ thanh toán 5 sao
                await context.Database.ExecuteSqlRawAsync("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[Invoices]') AND name = 'PaymentQrCode') ALTER TABLE [dbo].[Invoices] ADD PaymentQrCode nvarchar(max) NULL;");
            } catch (Exception ex) { 
                Console.WriteLine($"HMS Schema Sync Error: {ex.Message}");
            }

            string[] roles = { "Admin", "Manager", "Receptionist", "Housekeeper", "Technician", "Guest" };
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
                ("Lê Văn Nam", "nam@hms.com", "NV004", StaffRole.Housekeeper, "Housekeeping", "Room Attendant")
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

            // 4. Seed System Settings
            if (!context.SystemSettings.Any())
            {
                context.SystemSettings.Add(new SystemSettings 
                { 
                    BankName = "OCB", 
                    AccountNumber = "462904", 
                    AccountHolder = "NGUYEN KHAC PHUOC",
                    HotelAddress = "69 Royal Plaza, Ho Chi Minh",
                    HotelPhone = "0945 123 456"
                });
                await context.SaveChangesAsync();
            }

            // 5. Seed Room Types
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
                new Room { RoomNumber = "202", Floor = 2, RoomTypeId = dlxType.RoomTypeId, Status = RoomStatus.VacantClean, BasePrice = 850000, CreatedBy = "System" },
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

            // --- HMS Rule: Đảm bảo có danh sách nhân viên & Tài khoản đăng nhập (Housekeeping) ---
            var hkData = new List<(string Code, string Name, string Email, string Phone, string Pos)>
            {
                ("HK-001", "Nguyễn Thị Mai", "mai.nt@hms.com", "0901234567", "Nhân viên dọn phòng"),
                ("HK-002", "Trần Văn Nam", "nam.tv@hms.com", "0901234568", "Nhân viên dọn phòng")
            };

            foreach (var s in hkData)
            {
                if (!context.Staffs.Any(staff => staff.EmployeeCode == s.Code))
                {
                    // 1. Tạo tài khoản đăng nhập (Identity)
                    var user = await userManager.FindByEmailAsync(s.Email);
                    if (user == null)
                    {
                        user = new IdentityUser { UserName = s.Email.Split('@')[0], Email = s.Email, EmailConfirmed = true };
                        await userManager.CreateAsync(user, "Hms@123");
                        await userManager.AddToRoleAsync(user, "Housekeeper");
                    }

                    // 2. Tạo hồ sơ nhân sự (Staff Profile)
                    context.Staffs.Add(new Staff
                    {
                        EmployeeCode = s.Code,
                        FullName = s.Name,
                        Email = s.Email,
                        Phone = s.Phone,
                        Department = "Housekeeping",
                        Position = s.Pos,
                        Role = StaffRole.Housekeeper,
                        HireDate = DateTime.Now.AddMonths(-new Random().Next(1, 12)),
                        CreatedAt = DateTime.Now,
                        CreatedBy = "System"
                    });
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

            // 7. Seed Guest Member (Loyalty)
            if (await userManager.FindByEmailAsync("member@gmail.com") == null)
            {
                var guestUser = new IdentityUser { 
                    UserName = "member", 
                    Email = "member@gmail.com", 
                    EmailConfirmed = true,
                    PhoneNumber = "0909000123" // 🛡️ BẮT BUỘC ĐỂ NHẬN DIỆN ID CHO GUEST
                };
                var result = await userManager.CreateAsync(guestUser, "Guest@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(guestUser, "Guest");
                    
                    if (!context.Guests.Any(g => g.Email == "member@gmail.com"))
                    {
                        var guestProfile = new Guest {
                            GuestId = Guid.NewGuid(), // Khởi tạo Guid mới
                            FullName = "Nguyễn Thành Viên",
                            Email = "member@gmail.com",
                            Phone = "0909000123",
                            IdNumber = "123456789012",
                            Nationality = "Vietnam",
                            DateOfBirth = new DateTime(1995, 5, 10),
                            GuestType = GuestType.VIP,
                            Preferences = "",
                            IsDeleted = false,
                            CreatedAt = DateTime.Now,
                            CreatedBy = "System"
                        };
                        context.Guests.Add(guestProfile);
                        await context.SaveChangesAsync();

                        var loyalty = new LoyaltyAccount {
                            AccountId = Guid.NewGuid(),
                            GuestId = guestProfile.GuestId, // Link qua Guid
                            MemberNumber = "GOLD-8888", 
                            Tier = LoyaltyTier.Gold, 
                            CurrentPoints = 500,
                            LifetimePoints = 1000,
                            EnrolledAt = DateTime.Now,
                            IsDeleted = false,
                            CreatedAt = DateTime.Now,
                            CreatedBy = "System"
                        };
                        context.LoyaltyAccounts.Add(loyalty);
                        
                        await context.SaveChangesAsync();
                    }
                }
            }
        }
    }
}
