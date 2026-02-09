import pool from '../db.ts';
import type { Order, OrderItem } from "../models/order.model.js";

export class OrderRepository {
  constructor() {}

  async insertOrder(order: Order) {
    const orderId: number = order.order_id;
    const requested: OrderItem[] = order.requested;
    try {
      for (const item of requested) {
        await pool.query(
          `
          INSERT INTO orders (order_id, product_id, quantity)
          VALUES ($1, $2, $3)
          `,
          [orderId, item.product_id, item.quantity]
        );
      }
    } catch (error) {
      console.error(error);
    }
  }
}