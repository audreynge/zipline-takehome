import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { OrderService } from '../../src/services/order.service.ts';
import type { Order, OrderItem } from '../../src/models/order.model.ts';
import type { ShipmentItem } from '../../src/models/shipment.model.ts';

describe('OrderService', () => {
  let mockInsertOrder: jest.Mock<(order: Order) => Promise<void>>;
  let mockInsertPendingOrder: jest.Mock<(order: Order) => Promise<void>>;
  let mockGetPendingOrders: jest.Mock<() => Promise<Order[]>>;
  let mockUpdatePendingOrder: jest.Mock<(orderId: number, remaining: OrderItem[]) => Promise<void>>;
  let mockRemovePendingOrder: jest.Mock<(orderId: number) => Promise<void>>;
  let mockGetQuantity: jest.Mock<(productId: number) => Promise<number>>;
  let mockRemoveStock: jest.Mock<(productId: number, quantity: number) => Promise<void>>;
  let mockShipItems: jest.Mock<(orderId: number, items: ShipmentItem[]) => Promise<void>>;
  let service: OrderService;

  beforeEach(() => {
    mockInsertOrder = jest.fn<(order: Order) => Promise<void>>().mockResolvedValue(undefined);
    mockInsertPendingOrder = jest.fn<(order: Order) => Promise<void>>().mockResolvedValue(undefined);
    mockGetPendingOrders = jest.fn<() => Promise<Order[]>>().mockResolvedValue([]);
    mockUpdatePendingOrder = jest.fn<(orderId: number, remaining: OrderItem[]) => Promise<void>>().mockResolvedValue(undefined);
    mockRemovePendingOrder = jest.fn<(orderId: number) => Promise<void>>().mockResolvedValue(undefined);
    mockGetQuantity = jest.fn<(productId: number) => Promise<number>>();
    mockRemoveStock = jest.fn<(productId: number, quantity: number) => Promise<void>>().mockResolvedValue(undefined);
    mockShipItems = jest.fn<(orderId: number, items: ShipmentItem[]) => Promise<void>>().mockResolvedValue(undefined);

    const orderRepo = {
      insertOrder: mockInsertOrder,
      insertPendingOrder: mockInsertPendingOrder,
      getPendingOrders: mockGetPendingOrders,
      updatePendingOrder: mockUpdatePendingOrder,
      removePendingOrder: mockRemovePendingOrder,
    };

    const inventoryService = {
      getQuantity: mockGetQuantity,
      removeStock: mockRemoveStock,
      processStock: jest.fn(),
    };

    const shipmentService = {
      shipItems: mockShipItems,
    };

    service = new OrderService(
      orderRepo as any,
      inventoryService as any,
      shipmentService as any,
    );
  });

  describe('processOrder', () => {
    it('ships everything when fully in stock', async () => {
      mockGetQuantity.mockImplementation(async (id: number) => {
        if (id === 0) return 5;
        if (id === 10) return 5;
        return 0;
      });

      await service.processOrder({
        order_id: 123,
        requested: [
          { product_id: 0, quantity: 2 },
          { product_id: 10, quantity: 4 },
        ],
      });

      expect(mockRemoveStock).toHaveBeenCalledWith(0, 2);
      expect(mockRemoveStock).toHaveBeenCalledWith(10, 4);
      expect(mockShipItems).toHaveBeenCalledWith(123, [
        { product_id: 0, quantity: 2 },
        { product_id: 10, quantity: 4 },
      ]);
      expect(mockInsertPendingOrder).not.toHaveBeenCalled();
    });

    it('ships partial and defers the rest when not enough stock', async () => {
      mockGetQuantity.mockImplementation(async (id: number) => {
        if (id === 0) return 1;
        if (id === 10) return 2;
        return 0;
      });

      await service.processOrder({
        order_id: 456,
        requested: [
          { product_id: 0, quantity: 2 },
          { product_id: 10, quantity: 4 },
        ],
      });

      // ships what's available
      expect(mockRemoveStock).toHaveBeenCalledWith(0, 1);
      expect(mockRemoveStock).toHaveBeenCalledWith(10, 2);
      expect(mockShipItems).toHaveBeenCalledWith(456, [
        { product_id: 0, quantity: 1 },
        { product_id: 10, quantity: 2 },
      ]);
      // defers remainder
      expect(mockInsertPendingOrder).toHaveBeenCalledWith({
        order_id: 456,
        requested: [
          { product_id: 0, quantity: 1 },
          { product_id: 10, quantity: 2 },
        ],
      });
    });

    it('defers entire order when no stock', async () => {
      mockGetQuantity.mockResolvedValue(0);

      await service.processOrder({
        order_id: 789,
        requested: [{ product_id: 0, quantity: 2 }],
      });

      expect(mockShipItems).not.toHaveBeenCalled();
      expect(mockRemoveStock).not.toHaveBeenCalled();
      expect(mockInsertPendingOrder).toHaveBeenCalledWith({
        order_id: 789,
        requested: [{ product_id: 0, quantity: 2 }],
      });
    });

    it('handles empty requested list', async () => {
      await service.processOrder({ order_id: 999, requested: [] });

      expect(mockShipItems).not.toHaveBeenCalled();
      expect(mockInsertPendingOrder).not.toHaveBeenCalled();
      expect(mockInsertOrder).toHaveBeenCalled();
    });

    it('always persists the full order', async () => {
      mockGetQuantity.mockResolvedValue(100);
      const order = {
        order_id: 111,
        requested: [{ product_id: 0, quantity: 3 }],
      };

      await service.processOrder(order);

      expect(mockInsertOrder).toHaveBeenCalledWith(order);
    });
  });

  describe('fulfillPendingOrders', () => {
    it('ships pending order fully when stock is available and removes it', async () => {
      mockGetPendingOrders.mockResolvedValue([
        { order_id: 200, requested: [{ product_id: 0, quantity: 3 }] },
      ]);
      mockGetQuantity.mockResolvedValue(5);

      await service.fulfillPendingOrders();

      expect(mockRemoveStock).toHaveBeenCalledWith(0, 3);
      expect(mockShipItems).toHaveBeenCalledWith(200, [
        { product_id: 0, quantity: 3 },
      ]);
      expect(mockRemovePendingOrder).toHaveBeenCalledWith(200);
      expect(mockUpdatePendingOrder).not.toHaveBeenCalled();
    });

    it('partially fulfills pending order and updates remaining', async () => {
      mockGetPendingOrders.mockResolvedValue([
        {
          order_id: 300,
          requested: [
            { product_id: 0, quantity: 5 },
            { product_id: 1, quantity: 3 },
          ],
        },
      ]);
      mockGetQuantity.mockImplementation(async (id: number) => {
        if (id === 0) return 2;
        if (id === 1) return 0;
        return 0;
      });

      await service.fulfillPendingOrders();

      expect(mockRemoveStock).toHaveBeenCalledWith(0, 2);
      expect(mockShipItems).toHaveBeenCalledWith(300, [
        { product_id: 0, quantity: 2 },
      ]);
      expect(mockUpdatePendingOrder).toHaveBeenCalledWith(300, [
        { product_id: 0, quantity: 3 },
        { product_id: 1, quantity: 3 },
      ]);
    });

    it('does nothing when no pending orders exist', async () => {
      mockGetPendingOrders.mockResolvedValue([]);

      await service.fulfillPendingOrders();

      expect(mockShipItems).not.toHaveBeenCalled();
      expect(mockRemoveStock).not.toHaveBeenCalled();
    });

    it('processes multiple pending orders', async () => {
      mockGetPendingOrders.mockResolvedValue([
        { order_id: 400, requested: [{ product_id: 0, quantity: 1 }] },
        { order_id: 401, requested: [{ product_id: 1, quantity: 2 }] },
      ]);
      mockGetQuantity.mockResolvedValue(10);

      await service.fulfillPendingOrders();

      expect(mockShipItems).toHaveBeenCalledTimes(2);
      expect(mockRemovePendingOrder).toHaveBeenCalledWith(400);
      expect(mockRemovePendingOrder).toHaveBeenCalledWith(401);
    });

    it('skips shipping when pending order has no stock available', async () => {
      mockGetPendingOrders.mockResolvedValue([
        { order_id: 500, requested: [{ product_id: 0, quantity: 5 }] },
      ]);
      mockGetQuantity.mockResolvedValue(0);

      await service.fulfillPendingOrders();

      expect(mockShipItems).not.toHaveBeenCalled();
      expect(mockUpdatePendingOrder).toHaveBeenCalledWith(500, [
        { product_id: 0, quantity: 5 },
      ]);
    });
  });
});