import pool from '../database/connection.ts';

export class InventoryRepository {
  constructor() {}

  /**
   * Initializes the quantity of a product to be 0.
   * @param productId the product ID to initialize
   */
  async createInventoryItem(productId: number) {
    await pool.query(
      `
      INSERT INTO inventory (product_id, quantity)
      VALUES ($1, 0)
      ON CONFLICT (product_id) DO NOTHING
      `,
      [productId]
    );
  }

  /**
   * Adds stock to a product in the inventory.
   * @param productId the ID of the product
   * @param quantity the quantity of stock to add
   */
  async addStock(productId: number, quantity: number) {
    await pool.query(
      `
      UPDATE inventory
      SET quantity = quantity + $1
      WHERE product_id = $2
      `,
      [quantity, productId]
    )
  }

  /**
   * Removes stock from a product in the inventory.
   * @param productId the ID of the product
   * @param quantity the quantity of stock to remove
   */
  async removeStock(productId: number, quantity: number) {
    await pool.query(
      `
      UPDATE inventory
      SET quantity = quantity - $1
      WHERE product_id = $2 AND quantity >= $1
      `,
      [quantity, productId]
    )
  }

  /**
   * Returns the quantity of a product in the inventory.
   * @param productId the ID of the product
   * @returns quantity of the product
   */
  async getQuantity(productId: number) {
    const result = await pool.query(
      `
      SELECT quantity
      FROM inventory
      WHERE product_id = $1
      `,
      [productId]
    );
    if (!result.rows[0]) {
      throw new Error('Product not found in inventory');
    }
    return result.rows[0].quantity;
  }
}