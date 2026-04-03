using Demo02.Data.Repositories;
using Demo02.Models;

namespace Demo02.Services
{
    public class InventoryService : IInventoryService
    {
        private readonly IUnitOfWork _uow;

        public InventoryService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> ConsumeItemAsync(Guid itemId, decimal quantity)
        {
            var item = await _uow.InventoryItems.GetByIdAsync(itemId);
            if (item == null || item.CurrentStock < quantity) return false;

            item.CurrentStock -= quantity;

            // --- BRD Rule UC-23: Cảnh báo tồn kho thấp ---
            if (item.CurrentStock <= item.MinimumStock)
            {
                // Logic bắn alert/notification có thể thêm ở đây
            }

            return await _uow.CompleteAsync() > 0;
        }

        public async Task<IEnumerable<InventoryItem>> GetLowStockItemsAsync()
        {
            return await _uow.InventoryItems.FindAsync(i => i.CurrentStock <= i.MinimumStock);
        }
    }
}
