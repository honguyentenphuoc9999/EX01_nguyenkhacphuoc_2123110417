using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Demo02.Data;
using Demo02.Data.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<WarehouseDbContext>(options =>
options.UseSqlServer(builder.Configuration.GetConnectionString("WarehouseConnection")));

// --- HMS Rule: Cấu hình CORS để Frontend (React) có thể gọi API ---
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => {
        policy.SetIsOriginAllowed(origin => true) // Cấu hình linh hoạt cho phép mọi origin nhưng hỗ trợ credentials
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Quan trọng: Cho phép gửi kèm Token/Cookies
    });
});

// --- 1. Cấu hình Identity (HMS Rule: Quản lý người dùng) ---
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options => {
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// --- 2. Cấu hình JWT Authentication (BRD NFR-06) ---
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options => {
    options.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

// Add Repository and Unit of Work
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddHttpContextAccessor();
// Add Services
builder.Services.AddScoped<Demo02.Services.IReservationService, Demo02.Services.ReservationService>();
builder.Services.AddScoped<Demo02.Services.IInventoryService, Demo02.Services.InventoryService>();

builder.Services.AddHostedService<Demo02.Services.NoShowBackgroundService>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true; // Chấp nhận cả imageUrl và ImageUrl
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase; // Chuẩn hóa về kiểu chữ thường
    });

builder.Services.AddEndpointsApiExplorer();

// --- 3. Cấu hình Swagger hỗ trợ JWT ---
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "HMS API", Version = "v3.0" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {
        {
            new OpenApiSecurityScheme {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] { }
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
// 1. Tự động ép tất cả traffic sang HTTPS ngay giây đầu tiên (Fix lỗi URL HTTP)
app.UseHttpsRedirection();

// Luôn bật Swagger để giáo viên có thể kiểm tra API từ xa qua link live
app.UseSwagger();
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "HMS API v3.0");
    c.RoutePrefix = string.Empty; // Đặt Swagger làm trang chủ khi vào link
});

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// --- Khởi tạo dữ liệu mẫu (Seed Data) ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.Migrate(); // Tự động tạo bảng và cập nhật cấu trúc DB trên server
        var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        await DbSeeder.SeedAsync(context, userManager, roleManager);
        await DbRepair.FixGuestPhoneAsync(context); // 🛡️ ÉP LIÊN KẾT SĐT CHO GUEST MẪU
        await DbRepair.FixRoomStatusesAsync(context); // 🛡️ Đồng bộ lại trạng thái phòng nếu lỡ Check-in lỗi từ trước
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Lỗi khi khởi tạo dữ liệu mẫu.");
    }
}

app.MapControllers();

app.Run();
