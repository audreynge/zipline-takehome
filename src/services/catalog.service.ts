import { CatalogRepository } from '../repositories/catalog.repository.ts';
import { InventoryRepository } from '../repositories/inventory.repository.ts';
import type { CatalogProduct } from '../models/catalog.model.ts';

export class CatalogService {
  private catalogRepo: CatalogRepository;
  private inventoryRepo: InventoryRepository;

  constructor() {
    this.catalogRepo = new CatalogRepository();
    this.inventoryRepo = new InventoryRepository();
  }

  /**
   * Initializes the catalog and inventory.
   * Called once at start.
   * @param productInfo 
   */
  async initCatalog(productInfo: CatalogProduct[]) {
    try {
      for (const product of productInfo) {
        await this.catalogRepo.insertProduct(product);
        await this.inventoryRepo.createInventoryItem(product.product_id);
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to initialize catalog');
    }
  }

  /**
   * Returns a product from the catalog.
   * @param productId the ID of the product
   * @returns the product
   */
  async getProduct(productId: number) {
    try {
      return await this.catalogRepo.getProduct(productId);
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to get product: ${error}`);
    }
  }
}