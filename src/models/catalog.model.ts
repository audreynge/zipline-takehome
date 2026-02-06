/**
 * Represents what products can be stocked and ordered.
 */
export type Catalog = {
  /** Unique identifier of the catalog */
  catalog_id: number

  /** List of products in the catalog */
  products: CatalogProduct[]
}

/**
 * Represents a product in the catalog.
 */
export type CatalogProduct = {
  /** Unique identifier of the product */
  product_id: number;

  /** Human-readable name of the product */
  product_name: string;

  /** Mass of a single unit of this product (in grams) */
  mass_g: number;
}