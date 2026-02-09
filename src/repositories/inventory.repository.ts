import pool from '../db.ts';

export class InventoryRepository {
  constructor() {}

  /**
   * Initializes the quantity of a product to be 0.
   * @param productId the product ID to initialize
   */
  async createInventoryItem(productId: number) {
    try {
      await pool.query(
        `
        INSERT INTO inventory (product_id, quantity)
        VALUES ($1, 0)
        `,
        [productId]
      );
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Adds stock to a product in the inventory.
   * @param productId the ID of the product
   * @param quantity the quantity of stock to add
   */
  async addStock(productId: number, quantity: number) {
    try {
      await pool.query(
        `
        UPDATE inventory
        SET quantity = quantity + $1
        WHERE product_id = $2
        `,
        [quantity, productId]
      )
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Removes stock from a product in the inventory.
   * @param productId the ID of the product
   * @param quantity the quantity of stock to remove
   */
  async removeStock(productId: number, quantity: number) {
    try {
      await pool.query(
        `
        UPDATE inventory
        SET quantity = quantity - $1
        WHERE product_id = $2
        `,
        [quantity, productId]
      )
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Returns the quantity of a product in the inventory.
   * @param productId the ID of the product
   * @returns quantity of the product
   */
  async getQuantity(productId: number) {
    try {
      const result = await pool.query(
        `
        SELECT quantity
        FROM inventory
        WHERE product_id = $1
        `,
        [productId]
      );
      return result.rows[0].quantity;
    } catch (error) {
      console.error(error);
    }
  }
}