import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ShipmentService } from '../../src/services/shipment.service.ts';
import type { CatalogProduct } from '../../src/models/catalog.model.ts';

describe('ShipmentService', () => {
  let mockGetProduct: jest.Mock<(id: unknown) => Promise<CatalogProduct | undefined>>;
  let logSpy: jest.SpiedFunction<typeof console.log>;
  let service: ShipmentService;

  beforeEach(() => {
    mockGetProduct = jest.fn();

    const catalogService = {
      getProduct: mockGetProduct,
      initCatalog: jest.fn(),
    };

    service = new ShipmentService(catalogService as any);

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  function parseShipment(callIndex: number) {
    const raw = logSpy.mock.calls[callIndex]?.[1] as string;
    return JSON.parse(raw);
  }

  describe('shipItems', () => {
    it('ships a single package when total mass is under 1.8kg', async () => {
      mockGetProduct.mockImplementation(async (id: unknown) => {
        if (id === 0) return { product_id: 0, product_name: 'RBC A+', mass_g: 700 };
        if (id === 10) return { product_id: 10, product_name: 'FFP A+', mass_g: 300 };
      });

      await service.shipItems(123, [
        { product_id: 0, quantity: 1 },   // 700g
        { product_id: 10, quantity: 2 },  // 600g  => 1300g total
      ]);

      expect(logSpy).toHaveBeenCalledTimes(1);
      const pkg = parseShipment(0);
      expect(pkg.order_id).toBe(123);
      expect(pkg.shipped).toContainEqual({ product_id: 0, quantity: 1 });
      expect(pkg.shipped).toContainEqual({ product_id: 10, quantity: 2 });
    });

    it('splits into multiple packages when single item exceeds 1.8kg', async () => {
      mockGetProduct.mockResolvedValue({ product_id: 0, product_name: 'RBC A+', mass_g: 700 });

      await service.shipItems(1, [{ product_id: 0, quantity: 3 }]);

      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(parseShipment(0).shipped).toEqual([{ product_id: 0, quantity: 2 }]);
      expect(parseShipment(1).shipped).toEqual([{ product_id: 0, quantity: 1 }]);
    });

    it('splits when multiple items exceed 1.8kg total', async () => {
      mockGetProduct.mockImplementation(async (id: unknown) => {
        if (id === 0) return { product_id: 0, product_name: 'RBC A+', mass_g: 700 };
        if (id === 10) return { product_id: 10, product_name: 'FFP A+', mass_g: 300 };
      });

      await service.shipItems(2, [
        { product_id: 0, quantity: 2 },
        { product_id: 10, quantity: 3 },
      ]);

      expect(logSpy).toHaveBeenCalledTimes(2);
      const first = parseShipment(0);
      const second = parseShipment(1);
      expect(first.shipped).toContainEqual({ product_id: 0, quantity: 2 });
      expect(first.shipped).toContainEqual({ product_id: 10, quantity: 1 });
      expect(second.shipped).toEqual([{ product_id: 10, quantity: 2 }]);
    });

    it('no package exceeds 1800g', async () => {
      mockGetProduct.mockResolvedValue({ product_id: 0, product_name: 'RBC A+', mass_g: 600 });

      await service.shipItems(3, [{ product_id: 0, quantity: 5 }]);

      expect(logSpy).toHaveBeenCalledTimes(2);
      const mass1 = parseShipment(0).shipped.reduce(
        (s: number, i: { quantity: number }) => s + i.quantity * 600, 0,
      );
      const mass2 = parseShipment(1).shipped.reduce(
        (s: number, i: { quantity: number }) => s + i.quantity * 600, 0,
      );
      expect(mass1).toBeLessThanOrEqual(1800);
      expect(mass2).toBeLessThanOrEqual(1800);
    });

    it('handles exactly 1.8kg in one package', async () => {
      mockGetProduct.mockResolvedValue({ product_id: 0, product_name: 'RBC A+', mass_g: 600 });

      await service.shipItems(4, [{ product_id: 0, quantity: 3 }]);

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(parseShipment(0).shipped).toEqual([{ product_id: 0, quantity: 3 }]);
    });

    it('skips items whose product is not in catalog', async () => {
      mockGetProduct.mockImplementation(async (id: unknown) => {
        if (id === 0) return { product_id: 0, product_name: 'RBC A+', mass_g: 700 };
        return undefined;
      });

      await service.shipItems(5, [
        { product_id: 0, quantity: 1 },
        { product_id: 999, quantity: 10 },
      ]);

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(parseShipment(0).shipped).toEqual([{ product_id: 0, quantity: 1 }]);
    });

    it('does not call shipPackage when items list is empty', async () => {
      await service.shipItems(6, []);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('handles many small items packed together', async () => {
      mockGetProduct.mockResolvedValue({ product_id: 8, product_name: 'Plasma', mass_g: 40 });

      await service.shipItems(7, [{ product_id: 8, quantity: 45 }]);

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(parseShipment(0).shipped).toEqual([{ product_id: 8, quantity: 45 }]);
    });

    it('handles many small items that spill into a second package', async () => {
      mockGetProduct.mockResolvedValue({ product_id: 8, product_name: 'Plasma', mass_g: 40 });

      await service.shipItems(8, [{ product_id: 8, quantity: 46 }]);

      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(parseShipment(0).shipped).toEqual([{ product_id: 8, quantity: 45 }]);
      expect(parseShipment(1).shipped).toEqual([{ product_id: 8, quantity: 1 }]);
    });
  });
});