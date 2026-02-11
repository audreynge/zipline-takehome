import { InventoryService } from '../../src/services/inventory.service.ts';

describe('InventoryService', () => {
  let mockAddStock: jest.Mock;
  let mockRemoveStock: jest.Mock;
  let mockGetQuantity: jest.Mock;
  let service: InventoryService;

  beforeEach(() => {
    mockAddStock = jest.fn().mockResolvedValue(undefined);
    mockRemoveStock = jest.fn().mockResolvedValue(undefined);
    mockGetQuantity = jest.fn();

    const inventoryRepo = {
      addStock: mockAddStock,
      removeStock: mockRemoveStock,
      getQuantity: mockGetQuantity,
      createInventoryItem: jest.fn(),
    };

    service = new InventoryService(inventoryRepo as any);
  });

  describe('processStock', () => {
    it('calls addStock for each item', async () => {
      await service.processStock([
        { product_id: 0, quantity: 30 },
        { product_id: 1, quantity: 25 },
      ]);

      expect(mockAddStock).toHaveBeenCalledTimes(2);
      expect(mockAddStock).toHaveBeenCalledWith(0, 30);
      expect(mockAddStock).toHaveBeenCalledWith(1, 25);
    });

    it('handles single item restock', async () => {
      await service.processStock([{ product_id: 5, quantity: 10 }]);

      expect(mockAddStock).toHaveBeenCalledTimes(1);
      expect(mockAddStock).toHaveBeenCalledWith(5, 10);
    });

    it('handles empty restock list', async () => {
      await service.processStock([]);

      expect(mockAddStock).not.toHaveBeenCalled();
    });

    it('handles zero quantity restock', async () => {
      await service.processStock([{ product_id: 0, quantity: 0 }]);

      expect(mockAddStock).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('removeStock', () => {
    it('delegates to repository', async () => {
      await service.removeStock(3, 7);

      expect(mockRemoveStock).toHaveBeenCalledWith(3, 7);
    });
  });

  describe('getQuantity', () => {
    it('returns quantity from repository', async () => {
      mockGetQuantity.mockResolvedValue(42);

      expect(await service.getQuantity(0)).toBe(42);
      expect(mockGetQuantity).toHaveBeenCalledWith(0);
    });

    it('propagates error for unknown product', async () => {
      mockGetQuantity.mockRejectedValue(new Error('Product not found in inventory'));

      await expect(service.getQuantity(999)).rejects.toThrow('Product not found in inventory');
    });
  });
});