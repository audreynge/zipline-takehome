/** 
 * Represents a list of products to restock.
 */
export type Restock = RestockItem[]

/** 
 * Represents a product to restock.
 */
export type RestockItem = {
  /** The ID of the product to restock */
  product_id: number

  /** Number of units of the product to restock */
  quantity: number
}