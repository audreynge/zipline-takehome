import { OrderRepository } from '../repositories/order.repository.ts';
import { InventoryService } from './inventory.service.ts';
import { ShipmentService } from './shipment.service.ts';
import type { Order, OrderItem } from '../models/order.model.ts';
import type { ShipmentItem } from '../models/shipment.model.ts';

/**
 * Service for deciding what to ship and what to defer in each order.
 * Calls shipment service when items are ready.
 */
export class OrderService {
  private orderRepo: OrderRepository;
  private inventoryService: InventoryService;
  private shipmentService: ShipmentService;

  constructor(
    orderRepo: OrderRepository,
    inventoryService: InventoryService,
    shipmentService: ShipmentService,
  ) {
    this.orderRepo = orderRepo;
    this.inventoryService = inventoryService;
    this.shipmentService = shipmentService;
  }

  /**
   * Processes an incoming order. Ships what's in stock,
   * defers the rest as a pending order.
   * @param order the order to be processed
   * 
   * TODO: implement transaction
   */
  async processOrder(order: Order): Promise<void> {
    const { order_id, requested } = order;
    const toShip: ShipmentItem[] = [];
    const toDefer: OrderItem[] = [];

    for (const item of requested) {
      const { product_id, quantity } = item;
      const quantityInStock = await this.inventoryService.getQuantity(product_id);

      const qtyToShip = Math.min(quantity, quantityInStock);
      const qtyToDefer = quantity - qtyToShip;

      if (qtyToShip > 0) {
        toShip.push({ product_id, quantity: qtyToShip });
        await this.inventoryService.removeStock(product_id, qtyToShip);
      }

      if (qtyToDefer > 0) {
        toDefer.push({ product_id, quantity: qtyToDefer });
      }
    }

    // insert full order
    await this.orderRepo.insertOrder(order);

    if (toShip.length > 0) {
      await this.shipmentService.shipItems(order_id, toShip);
    }

    if (toDefer.length > 0) {
      await this.orderRepo.insertPendingOrder({ order_id, requested: toDefer });
    }
  }

  /**
   * Called after a restock to attempt fulfillment of all pending orders.
   * Ships what's now available, updates or removes pending records.
   * 
   * TODO: implement transaction
   */
  async fulfillPendingOrders(): Promise<void> {
    const pendingOrders = await this.orderRepo.getPendingOrders();

    for (const pending of pendingOrders) {
      const toShip: ShipmentItem[] = [];
      const stillRemaining: OrderItem[] = [];

      for (const item of pending.requested) {
        const { product_id, quantity } = item;
        const quantityInStock = await this.inventoryService.getQuantity(product_id);

        const qtyToShip = Math.min(quantity, quantityInStock);
        const qtyRemaining = quantity - qtyToShip;

        if (qtyToShip > 0) {
          toShip.push({ product_id, quantity: qtyToShip });
          await this.inventoryService.removeStock(product_id, qtyToShip);
        }

        if (qtyRemaining > 0) {
          stillRemaining.push({ product_id, quantity: qtyRemaining });
        }
      }

      if (toShip.length > 0) {
        await this.shipmentService.shipItems(pending.order_id, toShip);
      }

      if (stillRemaining.length > 0) {
        await this.orderRepo.updatePendingOrder(pending.order_id, stillRemaining);
      } else {
        await this.orderRepo.removePendingOrder(pending.order_id);
      }
    }
  }
}