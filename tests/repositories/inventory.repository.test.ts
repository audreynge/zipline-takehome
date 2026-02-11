jest.mock('../../src/database/connection.ts', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

import pool from '../../src/database/connection.ts';
import { InventoryRepository } from '../../src/repositories/inventory.repository.ts';

const mockQuery = pool.query as jest.Mock;

describe('InventoryRepository', () => {
  const repo = new InventoryRepository();

  describe('createInventoryItem', () => {
    it('inserts row with quantity 0', async () => {
      mockQuery.mockResolvedValue({});
      await repo.createInventoryItem(5);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO inventory'),
        [5, 0],
      );
    });
  });

  describe('addStock', () => {
    it('updates quantity with addition', async () => {
      mockQuery.mockResolvedValue({});
      await repo.addStock(1, 10);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('quantity + $1'),
        [10, 1],
      );
    });

    it('handles zero quantity', async () => {
      mockQuery.mockResolvedValue({});
      await repo.addStock(1, 0);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('quantity + $1'),
        [0, 1],
      );
    });
  });

  describe('removeStock', () => {
    it('updates quantity with subtraction', async () => {
      mockQuery.mockResolvedValue({});
      await repo.removeStock(2, 3);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('quantity - $1'),
        [3, 2],
      );
    });
  });

  describe('getQuantity', () => {
    it('returns quantity when product exists', async () => {
      mockQuery.mockResolvedValue({ rows: [{ quantity: 42 }] });

      const qty = await repo.getQuantity(7);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT quantity'),
        [7],
      );
      expect(qty).toBe(42);
    });

    it('throws when product not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await expect(repo.getQuantity(999)).rejects.toThrow('Product not found in inventory');
    });
  });
});