using Demo02.Models;
using Demo02.Data.Repositories;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;

namespace Demo02.Services
{
    public class NoShowBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<NoShowBackgroundService> _logger;

        public NoShowBackgroundService(IServiceProvider serviceProvider, ILogger<NoShowBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("No-Show processing task running at: {time}", DateTimeOffset.Now);

                // --- BRD UC-05: Tự động xử lý No-show lúc 18h00 ---
                if (DateTime.Now.Hour >= 18)
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                        
                        var today = DateTime.Now.Date;
                        var pendingReservations = await uow.Reservations.FindAsync(r => 
                            r.CheckInDate.Date == today && 
                            (r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.Confirmed));

                        foreach (var res in pendingReservations)
                        {
                            res.Status = ReservationStatus.NoShow;
                            res.NoShowDetectedAt = DateTime.Now;

                            // --- 🛡️ Smart Sync: Giải phóng phòng cho khách đặt sau ---
                            if (res.RoomId.HasValue && res.RoomId != Guid.Empty)
                            {
                                var room = await uow.Rooms.GetByIdAsync(res.RoomId.Value);
                                if (room != null) room.Status = RoomStatus.VacantClean;
                            }

                            _logger.LogWarning("Reservation {code} marked as No-Show and Room released at 18:00 cutoff", res.BookingCode);
                        }

                        if (pendingReservations.Any())
                        {
                            await uow.CompleteAsync();
                        }
                    }
                }

                // Chạy kiểm tra mỗi giờ
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }
}
