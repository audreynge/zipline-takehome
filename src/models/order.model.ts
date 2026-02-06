/**
 * Represents an order consisting of a list of requested products from a hospital.
 */
export type Order = {
  /** Unique identifier of the order */
  order_id: number;

  /** List of requested products from the hospital */
  requested: OrderItem[];
}

/**
 * Represents a requested product from a hospital.
 */
export type OrderItem ={
  /** The ID of the requested product */
  product_id: number;

  /** Number of units the hospital requested */
  quantity: number;
}