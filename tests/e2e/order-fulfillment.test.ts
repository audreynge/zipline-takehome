import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

/**
 * End-to-end tests for the order fulfillment flow
 */

import { CatalogService } from '../../src/services/catalog.service.ts';
import { InventoryService } from '../../src/services/inventory.service.ts';
import { OrderService } from '../../src/services/order.service.ts';
import { ShipmentService } from '../../src/services/shipment.service.ts';
import type { CatalogProduct } from '../../src/models/catalog.model.ts';
import type { Order, OrderItem } from '../../src/models/order.model.ts';

/**
 * Represents an in-memory fake catalog repository.
 * (still has same operations, just no real database interactions)
 */
class FakeCatalogRepository {
  private products = new Map<number, CatalogProduct>();

  async insertProduct(product: CatalogProduct) {
    if (!this.products.has(product.product_id)) {
      this.products.set(product.product_id, product);
    }
  }

  async getProduct(productId: number) {
    return this.products.get(productId);
  }
}

/**
 * Represents an in-memory fake inventory repository.
 */
class FakeInventoryRepository {
  private stock = new Map<number, number>();

  async createInventoryItem(productId: number) {
    if (!this.stock.has(productId)) {
      this.stock.set(productId, 0);
    }
  }

  async addStock(productId: number, quantity: number) {
    const current = this.stock.get(productId) ?? 0;
    this.stock.set(productId, current + quantity);
  }

  async removeStock(productId: number, quantity: number) {
    const current = this.stock.get(productId) ?? 0;
    if (current >= quantity) {
      this.stock.set(productId, current - quantity);
    }
  }

  async getQuantity(productId: number): Promise<number> {
    const qty = this.stock.get(productId);
    if (qty === undefined) {
      throw new Error('Product not found in inventory');
    }
    return qty;
  }

  // test helper
  _getStock(productId: number): number {
    return this.stock.get(productId) ?? 0;
  }
}

/**
 * Represents an in-memory fake order repository.
 */
class FakeOrderRepository {
  private orders: Order[] = [];
  private pending = new Map<number, OrderItem[]>();

  async insertOrder(order: Order) {
    this.orders.push(order);
  }

  async insertPendingOrder(order: Order) {
    this.pending.set(order.order_id, [...order.requested]);
  }

  async getPendingOrders() {
    return Array.from(this.pending.entries()).map(([order_id, requested]) => ({
      order_id,
      requested,
    }));
  }

  async updatePendingOrder(orderId: number, remaining: OrderItem[]) {
    this.pending.set(orderId, remaining);
  }

  async removePendingOrder(orderId: number) {
    this.pending.delete(orderId);
  }

  // test helper
  _hasPending(orderId: number): boolean {
    return this.pending.has(orderId);
  }
}



// --------- Tests ---------

const MAX_MASS_G = 1800;

const CATALOG: CatalogProduct[] = [
  { product_id: 0, product_name: 'RBC A+ Adult', mass_g: 700 },
  { product_id: 1, product_name: 'RBC B+ Adult', mass_g: 700 },
  { product_id: 4, product_name: 'RBC A+ Child', mass_g: 350 },
  { product_id: 8, product_name: 'CRYO A+', mass_g: 40 },
  { product_id: 10, product_name: 'FFP A+', mass_g: 300 },
];

/** Map product_id -> mass_g for weight calculations in assertions */
const MASS_BY_ID = new Map(CATALOG.map((p) => [p.product_id, p.mass_g]));

describe('Order fulfillment', () => {
  let inventoryRepo: FakeInventoryRepository;
  let orderRepo: FakeOrderRepository;
  let catalogService: CatalogService;
  let inventoryService: InventoryService;
  let orderService: OrderService;
  let logSpy: jest.Spied<typeof console.log>;

  beforeEach(async () => {
    const catalogRepo = new FakeCatalogRepository();
    inventoryRepo = new FakeInventoryRepository();
    orderRepo = new FakeOrderRepository();

    catalogService = new CatalogService(catalogRepo as any, inventoryRepo as any);
    inventoryService = new InventoryService(inventoryRepo as any);
    const shipmentService = new ShipmentService(catalogService as any);
    orderService = new OrderService(
      orderRepo as any,
      inventoryService as any,
      shipmentService as any,
    );

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await catalogService.initCatalog(CATALOG);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  // ---- helpers -------------

  /** Simulates InventoryController.processRestock (restock + fulfill pending) */
  const processRestock = async (restock: { product_id: number; quantity: number }[]) => {
    await inventoryService.processStock(restock);
    await orderService.fulfillPendingOrders();
  }

  /** Prints all shipments */
  const getShipments = (): { order_id: number; shipped: { product_id: number; quantity: number }[] }[] => {
    return logSpy.mock.calls
      .filter((call: any[]) => typeof call[0] === 'string' && call[0].startsWith('SHIPMENT:'))
      .map((call: any[]) => JSON.parse(call[1] as string));
  }

  /** Sums shipped quantities per product across all shipments for a given order */
  const totalShippedForOrder = (orderId: number) => {
    const totals = new Map<number, number>();
    for (const s of getShipments().filter((s) => s.order_id === orderId)) {
      for (const item of s.shipped) {
        totals.set(item.product_id, (totals.get(item.product_id) ?? 0) + item.quantity);
      }
    }
    return totals;
  }

  /** Calculates mass of a single shipment in grams */
  const shipmentMass = (shipped: { product_id: number; quantity: number }[]): number => {
    return shipped.reduce((sum, item) => {
      const mass = MASS_BY_ID.get(item.product_id) ?? 0;
      return sum + mass * item.quantity;
    }, 0);
  }

  // ---- tests --------------

  it('ships immediately when inventory is fully stocked', async () => {
    await processRestock([
      { product_id: 0, quantity: 10 },
      { product_id: 10, quantity: 5 },
    ]);

    await orderService.processOrder({
      order_id: 1,
      requested: [
        { product_id: 0, quantity: 2 },
        { product_id: 10, quantity: 2 },
      ],
    });

    const shipped = totalShippedForOrder(1);
    expect(shipped.get(0)).toBe(2);
    expect(shipped.get(10)).toBe(2);
    expect(orderRepo._hasPending(1)).toBe(false);
  });

  it('defers the entire order when no stock, then ships after restock', async () => {
    // Order with no stock so nothing should ship
    await orderService.processOrder({
      order_id: 2,
      requested: [{ product_id: 0, quantity: 3 }],
    });

    expect(getShipments()).toHaveLength(0);
    expect(orderRepo._hasPending(2)).toBe(true);

    // Restock triggers deferred fulfillment
    await processRestock([{ product_id: 0, quantity: 5 }]);

    const shipped = totalShippedForOrder(2);
    expect(shipped.get(0)).toBe(3);
    expect(orderRepo._hasPending(2)).toBe(false);
  });

  it('partially ships what is in stock and defers the rest', async () => {
    await processRestock([
      { product_id: 0, quantity: 1 },
      { product_id: 10, quantity: 2 },
    ]);

    await orderService.processOrder({
      order_id: 3,
      requested: [
        { product_id: 0, quantity: 3 },
        { product_id: 10, quantity: 2 },
      ],
    });

    // First shipment: 1 of product 0 + 2 of product 10
    let shipped = totalShippedForOrder(3);
    expect(shipped.get(0)).toBe(1);
    expect(shipped.get(10)).toBe(2);
    expect(orderRepo._hasPending(3)).toBe(true);

    // restcok remaining product 0
    await processRestock([{ product_id: 0, quantity: 5 }]);

    shipped = totalShippedForOrder(3);
    expect(shipped.get(0)).toBe(3); // 1 earlier + 2 now
    expect(shipped.get(10)).toBe(2);
    expect(orderRepo._hasPending(3)).toBe(false);
  });

  it('splits large orders into packages that each respect the 1.8kg limit', async () => {
    // 5 units of 700g = 3500g so should require at least 2 packages
    await processRestock([{ product_id: 0, quantity: 10 }]);

    await orderService.processOrder({
      order_id: 4,
      requested: [{ product_id: 0, quantity: 5 }],
    });

    const shipments = getShipments().filter((s) => s.order_id === 4);
    expect(shipments.length).toBeGreaterThanOrEqual(2);

    // every package must be within weight limit
    for (const s of shipments) {
      expect(shipmentMass(s.shipped)).toBeLessThanOrEqual(MAX_MASS_G);
    }

    // total shipped = requested
    const shipped = totalShippedForOrder(4);
    expect(shipped.get(0)).toBe(5);
  });

  it('handles mixed-weight items with package splitting', async () => {
    // 2 * 700g + 3 * 300g = 2300g, needs multiple packages
    await processRestock([
      { product_id: 0, quantity: 5 },
      { product_id: 10, quantity: 5 },
    ]);

    await orderService.processOrder({
      order_id: 5,
      requested: [
        { product_id: 0, quantity: 2 },
        { product_id: 10, quantity: 3 },
      ],
    });

    const shipments = getShipments().filter((s) => s.order_id === 5);

    for (const s of shipments) {
      expect(shipmentMass(s.shipped)).toBeLessThanOrEqual(MAX_MASS_G);
    }

    const shipped = totalShippedForOrder(5);
    expect(shipped.get(0)).toBe(2);
    expect(shipped.get(10)).toBe(3);
  });

  it('fulfills multiple pending orders on a single restock', async () => {
    // 2 orders, both deferred due to no stock
    await orderService.processOrder({
      order_id: 10,
      requested: [{ product_id: 4, quantity: 2 }],
    });
    await orderService.processOrder({
      order_id: 11,
      requested: [{ product_id: 4, quantity: 3 }],
    });

    expect(getShipments()).toHaveLength(0);

    // Single restock satisfies both
    await processRestock([{ product_id: 4, quantity: 10 }]);

    expect(totalShippedForOrder(10).get(4)).toBe(2);
    expect(totalShippedForOrder(11).get(4)).toBe(3);
    expect(orderRepo._hasPending(10)).toBe(false);
    expect(orderRepo._hasPending(11)).toBe(false);
  });

  it('restock only partially covers pending, remainder stays pending', async () => {
    await orderService.processOrder({
      order_id: 20,
      requested: [{ product_id: 0, quantity: 5 }],
    });

    // Restock only 2 of the 5 needed
    await processRestock([{ product_id: 0, quantity: 2 }]);

    expect(totalShippedForOrder(20).get(0)).toBe(2);
    expect(orderRepo._hasPending(20)).toBe(true);

    // Restock remaining 3
    await processRestock([{ product_id: 0, quantity: 3 }]);

    expect(totalShippedForOrder(20).get(0)).toBe(5);
    expect(orderRepo._hasPending(20)).toBe(false);
  });

  it('inventory is correctly decremented after shipping', async () => {
    await processRestock([{ product_id: 8, quantity: 100 }]);

    await orderService.processOrder({
      order_id: 30,
      requested: [{ product_id: 8, quantity: 40 }],
    });

    expect(inventoryRepo._getStock(8)).toBe(60);
  });

  it('many small items pack efficiently into packages', async () => {
    // 50 * 40g = 2000g, should be split into packages <= 1800g
    await processRestock([{ product_id: 8, quantity: 100 }]);

    await orderService.processOrder({
      order_id: 40,
      requested: [{ product_id: 8, quantity: 50 }],
    });

    const shipments = getShipments().filter((s) => s.order_id === 40);
    expect(shipments.length).toBeGreaterThanOrEqual(2);

    for (const s of shipments) {
      expect(shipmentMass(s.shipped)).toBeLessThanOrEqual(MAX_MASS_G);
    }

    expect(totalShippedForOrder(40).get(8)).toBe(50);
  });
});