using System.ComponentModel.DataAnnotations;

namespace Demo02.Models
{
    public abstract class BaseEntity
    {
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        [StringLength(50)]
        public string CreatedBy { get; set; } = "System";

        public DateTime? UpdatedAt { get; set; }
        [StringLength(50)]
        public string? UpdatedBy { get; set; }

        public bool IsDeleted { get; set; } = false; // Xóa mềm
        public DateTime? DeletedAt { get; set; }
    }
}