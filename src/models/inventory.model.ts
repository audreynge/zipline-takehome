/**
 * Represents the current quantities of products available at a nest.
 */
export type Inventory = {
  // future implementation, manage multiple inventories
  // /** Unique identifier of the inventory */
  // inventory_id: number;

  /** The ID of the product this inventory record tracks */
  product_id: number;

  /** Number of units of the product currently in stock */
  quantity: number;

  // nest_id?
}