using System;
using System.ComponentModel.DataAnnotations;

namespace Demo02.Models
{
    public class AuditLog
    {
        [Key]
        public Guid LogId { get; set; } = Guid.NewGuid();
        
        [Required]
        public string EntityName { get; set; } = string.Empty;
        
        [Required]
        public string EntityId { get; set; } = string.Empty;
        
        [Required]
        public string Action { get; set; } = string.Empty; // Create, Update, Delete
        
        public string? Changes { get; set; }
        
        public DateTime Timestamp { get; set; } = DateTime.Now;
        
        public string? UserId { get; set; }
    }
}
