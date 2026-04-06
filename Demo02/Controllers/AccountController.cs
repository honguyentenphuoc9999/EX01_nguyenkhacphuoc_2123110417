using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // Cần thiết để dùng FirstOrDefaultAsync
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Demo02.Models.DTOs;

namespace Demo02.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly Demo02.Data.AppDbContext _context;

        public AccountController(
            UserManager<IdentityUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration configuration,
            Demo02.Data.AppDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _context = context;
        }

        // POST: api/Account/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var user = new IdentityUser { UserName = dto.Username, Email = dto.Email };
            var result = await _userManager.CreateAsync(user, dto.Password);

            if (!result.Succeeded) return BadRequest(result.Errors);

            // Kiểm tra và tạo Role nếu chưa tồn tại
            if (!await _roleManager.RoleExistsAsync(dto.Role))
            {
                await _roleManager.CreateAsync(new IdentityRole(dto.Role));
            }

            await _userManager.AddToRoleAsync(user, dto.Role);

            // --- 🔄 TỰ ĐỘNG CẬP NHẬT HỒ SƠ NHÂN VIÊN (MỚI) ---
            if (!Enum.TryParse<Demo02.Models.StaffRole>(dto.Role, out var staffRole)) {
                staffRole = Demo02.Models.StaffRole.Receptionist;
            }

            var staff = new Demo02.Models.Staff {
                FullName = dto.Username,
                Email = dto.Email,
                Phone = "Chưa cập nhật",
                Role = staffRole,
                CreatedAt = DateTime.Now
            };
            _context.Staffs.Add(staff);
            await _context.SaveChangesAsync();

            return Ok(new AuthResponseDto { IsSuccess = true, Message = "User registered and Staff profile created successfully." });
        }

        // POST: api/Account/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _userManager.FindByNameAsync(dto.Username);
            if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            {
                return Unauthorized(new AuthResponseDto { IsSuccess = false, Message = "Invalid username or password." });
            }

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim(ClaimTypes.Email, user.Email!), // Cực kỳ quan trọng để Guest Portal hoạt động
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            var userRoles = await _userManager.GetRolesAsync(user);
            foreach (var role in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, role));
            }

            var token = GenerateToken(authClaims);

            // --- 🧠 SMART PROFILE LOOKUP ---
            string? finalFullName = user.UserName;
            string? finalPosition = userRoles.FirstOrDefault() ?? "Staff";
            Guid? finalId = null;

            // 1. Tìm hồ sơ nhân viên (Nếu có)
            var userEmail = user.Email?.ToLower().Trim();
            var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.Email.ToLower().Trim() == userEmail);
            
            if (staff != null) {
                finalFullName = staff.FullName;
                finalPosition = staff.Position ?? staff.Role.ToString();
                finalId = staff.StaffId;
            } else {
                // 2. Nếu không phải nhân viên, tìm hồ sơ Khách hàng (Dựa trên Email hoặc Phone)
                var guest = await _context.Guests.FirstOrDefaultAsync(g => 
                    (g.Email != null && g.Email.ToLower().Trim() == userEmail) || g.Phone == user.UserName);
                
                if (guest != null) {
                    finalFullName = guest.FullName;
                    
                    // --- 🇻🇳 VIỆT HÓA THEO LOẠI KHÁCH HÀNG (GUEST TYPE) ---
                    finalPosition = guest.GuestType switch {
                        Demo02.Models.GuestType.Regular => "KHÁCH LẺ THÔNG THƯỜNG",
                        Demo02.Models.GuestType.VIP => "KHÁCH HÀNG VIP (ƯU TIÊN)",
                        Demo02.Models.GuestType.Corporate => "KHÁCH ĐOÀN (CÔNG TY)",
                        Demo02.Models.GuestType.Member => "HỘI VIÊN LOYAL",
                        Demo02.Models.GuestType.Group => "KHÁCH THEO ĐOÀN LỚN",
                        _ => "KHÁCH HÀNG THÂN THIẾT"
                    };
                    
                    finalId = guest.GuestId;
                }
            }

            return Ok(new AuthResponseDto
            {
                IsSuccess = true,
                Message = "Login successful.",
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Username = user.UserName!,
                Role = userRoles.FirstOrDefault() ?? "Staff",
                FullName = finalFullName ?? user.UserName!,
                Position = finalPosition,
                StaffId = finalId
            });
        }

        private JwtSecurityToken GenerateToken(List<Claim> claims)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var authSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSettings["Key"]!));

            return new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                expires: DateTime.Now.AddDays(Convert.ToDouble(jwtSettings["ExpireDays"])),
                claims: claims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );
        }
    }
}
