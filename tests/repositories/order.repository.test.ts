import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule('../src/database/connection', () => ({
  default: { query: mockQuery },
}));

const { OrderRepository } = await import('../../src/repositories/order.repository.ts');

describe('OrderRepository', () => {
  const repo = new OrderRepository();

  describe('insertOrder', () => {
    it('inserts one row per order item', async () => {
      mockQuery.mockResolvedValue({});
      await repo.insertOrder({
        order_id: 100,
        requested: [
          { product_id: 0, quantity: 2 },
          { product_id: 10, quantity: 4 },
        ],
      });

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO orders'),
        [100, 0, 2],
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO orders'),
        [100, 10, 4],
      );
    });

    it('handles empty requested list', async () => {
      mockQuery.mockResolvedValue({});
      await repo.insertOrder({ order_id: 101, requested: [] });
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('insertPendingOrder', () => {
    it('inserts into pending_order_items', async () => {
      mockQuery.mockResolvedValue({});
      await repo.insertPendingOrder({
        order_id: 200,
        requested: [{ product_id: 0, quantity: 3 }],
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO pending_order_items'),
        [200, 0, 3],
      );
    });
  });

  describe('getPendingOrders', () => {
    it('groups rows by order_id', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { order_id: 1, product_id: 0, quantity: 2 },
          { order_id: 1, product_id: 1, quantity: 3 },
          { order_id: 2, product_id: 0, quantity: 1 },
        ],
      });

      const result = await repo.getPendingOrders();

      expect(result).toHaveLength(2);
      const byId = new Map(result.map((p) => [p.order_id, p]));
      expect(byId.get(1)?.requested).toEqual([
        { product_id: 0, quantity: 2 },
        { product_id: 1, quantity: 3 },
      ]);
      expect(byId.get(2)?.requested).toEqual([
        { product_id: 0, quantity: 1 },
      ]);
    });

    it('returns empty array when no rows', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      expect(await repo.getPendingOrders()).toEqual([]);
    });
  });

  describe('updatePendingOrder', () => {
    it('deletes old rows then inserts remaining items', async () => {
      mockQuery.mockResolvedValue({});
      await repo.updatePendingOrder(400, [
        { product_id: 0, quantity: 2 },
      ]);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      // first call: DELETE
      expect(mockQuery).toHaveBeenNthCalledWith(1,
        expect.stringContaining('DELETE FROM pending_order_items'),
        [400],
      );
      // second call: INSERT remaining
      expect(mockQuery).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INSERT INTO pending_order_items'),
        [400, 0, 2],
      );
    });

    it('only deletes when remaining is empty', async () => {
      mockQuery.mockResolvedValue({});
      await repo.updatePendingOrder(401, []);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM pending_order_items'),
        [401],
      );
    });
  });

  describe('removePendingOrder', () => {
    it('deletes all rows for the order', async () => {
      mockQuery.mockResolvedValue({});
      await repo.removePendingOrder(500);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM pending_order_items'),
        [500],
      );
    });
  });
});