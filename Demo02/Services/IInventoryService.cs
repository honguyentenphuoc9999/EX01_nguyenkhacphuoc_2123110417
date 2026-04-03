using Demo02.Models;

namespace Demo02.Services
{
    public interface IInventoryService
    {
        Task<bool> ConsumeItemAsync(Guid itemId, decimal quantity);
        Task<IEnumerable<InventoryItem>> GetLowStockItemsAsync();
    }
}
