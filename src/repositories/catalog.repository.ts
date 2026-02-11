import pool from '../database/connection.ts';
import type { CatalogProduct } from "../models/catalog.model.js";

export class CatalogRepository {
  constructor() {}

  /**
   * Inserts a product into the catalog.
   * @param product the product to be inserted
   */
  async insertProduct(product: CatalogProduct) {
    await pool.query(
      `
      INSERT INTO products (product_id, product_name, mass_g) 
      VALUES ($1, $2, $3)
      ON CONFLICT (product_id) DO NOTHING
      `,
      [product.product_id, product.product_name, product.mass_g]
    );
  }  

  /**
   * Returns a product from the catalog.
   * @param productId the ID of the product
   * @returns the product
   */
  async getProduct(productId: number) {
    const result = await pool.query(
    `
    SELECT * FROM products WHERE product_id = $1
    `,
    [productId]
  );
  return result.rows[0];
  }
}