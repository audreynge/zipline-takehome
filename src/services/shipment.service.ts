import { CatalogRepository } from '../repositories/catalog.repository.ts';
import type { Shipment, ShipmentItem } from '../models/shipment.model.ts';
import { CatalogService } from './catalog.service.ts';

const MAX_PACKAGE_MASS_G = 1800;

/**
 * Service for splitting items into packages that respect the
 * 1.8kg weight limit and shipping them.
 */
export class ShipmentService {
  private catalogService: CatalogService;

  constructor() {
    this.catalogService = new CatalogService();
  }

  /**
   * Splits items into packages and ships each one.
   */
  async shipItems(orderId: number, items: ShipmentItem[]): Promise<void> {
    const packages = await this.splitIntoPackages(items);

    for (const pkg of packages) {
      await this.shipPackage({ order_id: orderId, shipped: pkg });
    }
  }

  /**
   * Splits a list of items into packages, each within MAX_PACKAGE_MASS_G.
   * Handles items that need to be spread across multiple packages.
   */
  private async splitIntoPackages(items: ShipmentItem[]): Promise<ShipmentItem[][]> {
    const packages: ShipmentItem[][] = [];
    let currentPackage: ShipmentItem[] = [];
    let currentMass = 0;

    for (const item of items) {
      const product = await this.catalogService.getProduct(item.product_id);
      if (!product) continue;

      const unitMass = product.mass_g;
      let remainingQty = item.quantity;

      while (remainingQty > 0) {
        let spaceLeft = MAX_PACKAGE_MASS_G - currentMass;

        // Current package can't fit another unit — finalize and start new
        if (spaceLeft < unitMass) {
          if (currentPackage.length > 0) {
            packages.push(currentPackage);
          }
          currentPackage = [];
          currentMass = 0;
          spaceLeft = MAX_PACKAGE_MASS_G;
        }

        const canFit = Math.floor(spaceLeft / unitMass);
        const qtyToAdd = Math.min(remainingQty, canFit);

        currentPackage.push({
          product_id: item.product_id,
          quantity: qtyToAdd,
        });

        currentMass += qtyToAdd * unitMass;
        remainingQty -= qtyToAdd;
      }
    }

    if (currentPackage.length > 0) {
      packages.push(currentPackage);
    }

    return packages;
  }

  /**
   * Prints the shipment to the console.
   * @param shipment the shipment to be fulfilled
   */
  private async shipPackage(shipment: Shipment): Promise<void> {
    try {
      console.log('SHIPMENT:', JSON.stringify(shipment));
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to ship package: ${error}`);
    }
  }
}