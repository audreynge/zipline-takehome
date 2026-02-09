import { OrderRepository } from '../repositories/order.repository.ts';
import { InventoryService } from './inventory.service.ts';
import type { Order, OrderItem } from '../models/order.model.ts';
import type { Shipment, ShipmentItem } from '../models/shipment.model.ts';

/**
 * Service for deciding what to ship and what to defer in each order.
 * Calls shipment service when items are ready.
 */
export class OrderService {
  private orderRepo: OrderRepository;
  private inventoryService: InventoryService;

  constructor() {
    this.orderRepo = new OrderRepository();
    this.inventoryService = new InventoryService();
  }

  /**
   * Processes an order.
   * @param order the order to be processed
   */
  async processOrder(order: Order) {
    const { order_id, requested } = order;
    const toShip: ShipmentItem[] = [];
    const toDefer: OrderItem[] = [];
    try {
      for (const item of requested) {
        const { product_id, quantity } = item;
        const quantityInStock = await this.inventoryService.getQuantity(product_id);

        if (quantityInStock < quantity) {
          toDefer.push(item);
        } else {
          toShip.push(item);
          await this.inventoryService.removeStock(product_id, quantity);
        }


      }
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to process order: ${error}`);
    }
  }
}