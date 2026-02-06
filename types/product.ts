/**
 * Represents a product in the catalog.
 */
export type Product = {
  /** Unique identifier of the product */
  product_id: number;

  /** Human-readable name of the product */
  product_name: string;

  /** Mass of a single unit of this product (in grams) */
  mass_g: number;
}