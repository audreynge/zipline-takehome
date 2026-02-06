/**
 * Represents a distribution center at Zipline. Nests have:
 * - an inventory of products
 * - a team of operators who manage the inventory and process orders
 */
export type Nest = {
  /** The ID of the inventory at this nest */
  inventory_id: number;

  // future: team_id for the operators? then in team object, have operator id, etc
  // this way there can be multiple teams in a nest, and operators assigned to multiple teams at diff nests too
}