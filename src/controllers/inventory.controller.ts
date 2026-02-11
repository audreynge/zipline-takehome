import type { Request, Response } from 'express';
import type { InventoryService } from '../services/inventory.service.ts';
import type { OrderService } from '../services/order.service.ts';
import { AppError } from '../middleware/app-error.ts';

export class InventoryController {
  private inventoryService: InventoryService;
  private orderService: OrderService;

  constructor(inventoryService: InventoryService, orderService: OrderService) {
    this.inventoryService = inventoryService;
    this.orderService = orderService;
  }

  async processRestock(req: Request, res: Response) {
    const restock = Array.isArray(req.body) ? req.body : req.body.restock;
    if (!Array.isArray(restock)) {
      throw new AppError('Expected an array of restock items', 400);
    }

    await this.inventoryService.processStock(restock);
    await this.orderService.fulfillPendingOrders();
    res.status(200).json({ success: true, message: 'Restocked successfully' });
  }
}
