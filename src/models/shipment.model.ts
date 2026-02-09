/**
 * Represents a shipment of products from a nest to a hospital.
 */
export type Shipment = {
  /** Unique identifier of the order */
  order_id: number;

  /** List of products shipped */
  shipped: ShipmentItem[];
}

/**
 * Represents a product in a shipment.
 */
export type ShipmentItem = {
  /** The ID of the shipped product */
  product_id: number;

  /** Number of units of the product shipped */
  quantity: number;
}