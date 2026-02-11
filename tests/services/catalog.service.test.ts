import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CatalogService } from '../../src/services/catalog.service.ts';
import type { CatalogProduct } from '../../src/models/catalog.model.ts';

describe('CatalogService', () => {
  let mockInsertProduct: jest.Mock<(product: CatalogProduct) => Promise<void>>;
  let mockCreateInventoryItem: jest.Mock<(productId: number) => Promise<void>>;
  let mockGetProduct: jest.Mock<(productId: number) => Promise<CatalogProduct | undefined>>;
  let service: CatalogService;

  beforeEach(() => {
    mockInsertProduct = jest.fn<(product: CatalogProduct) => Promise<void>>().mockResolvedValue(undefined);
    mockGetProduct = jest.fn<(productId: number) => Promise<CatalogProduct | undefined>>();
    mockCreateInventoryItem = jest.fn<(productId: number) => Promise<void>>().mockResolvedValue(undefined);

    const catalogRepo = { insertProduct: mockInsertProduct, getProduct: mockGetProduct };
    const inventoryRepo = { createInventoryItem: mockCreateInventoryItem };

    service = new CatalogService(
      catalogRepo as any,
      inventoryRepo as any,
    );
  });

  describe('initCatalog', () => {
    it('inserts each product into catalog and creates inventory entry', async () => {
      await service.initCatalog([
        { product_id: 0, product_name: 'RBC A+ Adult', mass_g: 700 },
        { product_id: 1, product_name: 'RBC B+ Adult', mass_g: 700 },
      ]);

      expect(mockInsertProduct).toHaveBeenCalledTimes(2);
      expect(mockInsertProduct).toHaveBeenCalledWith(
        expect.objectContaining({ product_id: 0 }),
      );
      expect(mockInsertProduct).toHaveBeenCalledWith(
        expect.objectContaining({ product_id: 1 }),
      );
      expect(mockCreateInventoryItem).toHaveBeenCalledTimes(2);
      expect(mockCreateInventoryItem).toHaveBeenCalledWith(0);
      expect(mockCreateInventoryItem).toHaveBeenCalledWith(1);
    });

    it('handles empty product list', async () => {
      await service.initCatalog([]);

      expect(mockInsertProduct).not.toHaveBeenCalled();
      expect(mockCreateInventoryItem).not.toHaveBeenCalled();
    });

    it('handles single product', async () => {
      await service.initCatalog([
        { product_id: 10, product_name: 'FFP A+', mass_g: 300 },
      ]);

      expect(mockInsertProduct).toHaveBeenCalledTimes(1);
      expect(mockCreateInventoryItem).toHaveBeenCalledTimes(1);
      expect(mockCreateInventoryItem).toHaveBeenCalledWith(10);
    });
  });

  describe('getProduct', () => {
    it('delegates to catalog repository', async () => {
      mockGetProduct.mockResolvedValue({
        product_id: 0, product_name: 'RBC A+', mass_g: 700,
      });
      const result = await service.getProduct(0);

      expect(mockGetProduct).toHaveBeenCalledWith(0);
      expect(result).toEqual({ product_id: 0, product_name: 'RBC A+', mass_g: 700 });
    });

    it('returns undefined for unknown product', async () => {
      mockGetProduct.mockResolvedValue(undefined);

      expect(await service.getProduct(999)).toBeUndefined();
      expect(mockGetProduct).toHaveBeenCalledWith(999);
    });
  });
});