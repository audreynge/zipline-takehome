import { type Product } from "./product"

/**
 * Represents what products can be stocked and ordered.
 */
export type Catalog = {
  /** Unique identifier of the catalog */
  catalog_id: number

  /** List of products in the catalog */
  products: Record<number, Product>
}