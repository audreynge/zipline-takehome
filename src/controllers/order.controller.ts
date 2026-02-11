import type { Request, Response } from 'express';
import type { OrderService } from '../services/order.service.ts';
import { AppError } from '../middleware/app-error.ts';
import type { Order } from '../models/order.model.ts';

export class OrderController {
  private orderService: OrderService;

  constructor(orderService: OrderService) {
    this.orderService = orderService;
  }

  async processOrder(req: Request, res: Response) {
    const order = req.body as Order;
    if (!order || typeof order.order_id !== 'number' || !Array.isArray(order.requested)) {
      throw new AppError('Expected an order with order_id and requested items', 400);
    }

    await this.orderService.processOrder(order);
    res.status(200).json({ success: true, message: 'Order processed' });
  }
}
