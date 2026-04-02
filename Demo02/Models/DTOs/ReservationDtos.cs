using System;
using Demo02.Models;

namespace Demo02.Models.DTOs
{
    public class ReservationCreateDto
    {
        public Guid GuestId { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public BookingChannel Channel { get; set; } = BookingChannel.Direct;
        public string? SpecialRequests { get; set; }
        // We do NOT expose IsDeleted, CreatedAt, ReservationId here.
    }

    public class ReservationResponseDto
    {
        public Guid ReservationId { get; set; }
        public string BookingCode { get; set; } = string.Empty;
        public string GuestName { get; set; } = string.Empty;
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public ReservationStatus Status { get; set; }
        public decimal DepositAmount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
