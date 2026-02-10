import pool from '../database/connection.ts';
import type { Order, OrderItem } from "../models/order.model.js";

export class OrderRepository {
  constructor() {}

  async insertOrder(order: Order) {
    const orderId: number = order.order_id;
    const requested: OrderItem[] = order.requested;
    for (const item of requested) {
      await pool.query(
        `
        INSERT INTO orders (order_id, product_id, quantity)
        VALUES ($1, $2, $3)
        `,
        [orderId, item.product_id, item.quantity]
      );
    }
  }

  async insertPendingOrder(order: Order) {
    const orderId: number = order.order_id;
    const requested: OrderItem[] = order.requested;
    for (const item of requested) {
      await pool.query(
        `
        INSERT INTO pending_order_items (order_id, product_id, quantity)
        VALUES ($1, $2, $3)
        `,
        [orderId, item.product_id, item.quantity]
      );
    }
  }

  async getPendingOrders(): Promise<{ order_id: number; requested: OrderItem[] }[]> {
    const result = await pool.query(
      `SELECT order_id, product_id, quantity FROM pending_order_items ORDER BY order_id`
    );

    const orderMap = new Map<number, OrderItem[]>();

    for (const row of result.rows) {
      const items = orderMap.get(row.order_id) ?? [];
      items.push({ product_id: row.product_id, quantity: row.quantity });
      orderMap.set(row.order_id, items);
    }

    return Array.from(orderMap.entries()).map(([order_id, requested]) => ({
      order_id,
      requested,
    }));
  }

  async updatePendingOrder(orderId: number, remaining: OrderItem[]): Promise<void> {
    await pool.query(
      `DELETE FROM pending_order_items WHERE order_id = $1`,
      [orderId]
    );

    for (const item of remaining) {
      await pool.query(
        `
        INSERT INTO pending_order_items (order_id, product_id, quantity)
        VALUES ($1, $2, $3)
        `,
        [orderId, item.product_id, item.quantity]
      );
    }
  }

  async removePendingOrder(orderId: number): Promise<void> {
    await pool.query(
      `DELETE FROM pending_order_items WHERE order_id = $1`,
      [orderId]
    );
  }
}