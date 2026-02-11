import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule('../src/database/connection', () => ({
  default: { query: mockQuery },
}));

const { CatalogRepository } = await import('../../src/repositories/catalog.repository.ts');

describe('CatalogRepository', () => {
  const repo = new CatalogRepository();

  describe('insertProduct', () => {
    it('calls INSERT with correct params', async () => {
      mockQuery.mockResolvedValue({});
      await repo.insertProduct({ product_id: 0, product_name: 'RBC A+ Adult', mass_g: 700 });

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products'),
        [0, 'RBC A+ Adult', 700],
      );
    });

    it('propagates database errors', async () => {
      mockQuery.mockRejectedValue(new Error('duplicate key'));
      await expect(
        repo.insertProduct({ product_id: 0, product_name: 'RBC A+', mass_g: 700 }),
      ).rejects.toThrow('duplicate key');
    });
  });

  describe('getProduct', () => {
    it('returns the row when product exists', async () => {
      const row = { product_id: 0, product_name: 'RBC A+ Adult', mass_g: 700 };
      mockQuery.mockResolvedValue({ rows: [row] });

      const result = await repo.getProduct(0);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM products'),
        [0],
      );
      expect(result).toEqual(row);
    });

    it('returns undefined when product does not exist', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await repo.getProduct(999);

      expect(result).toBeUndefined();
    });
  });
});