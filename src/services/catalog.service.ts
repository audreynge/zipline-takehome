import { CatalogRepository } from '../repositories/catalog.repository.ts';
import { InventoryRepository } from '../repositories/inventory.repository.ts';
import type { CatalogProduct } from '../models/catalog.model.ts';

export class CatalogService {
  private catalogRepo: CatalogRepository;
  private inventoryRepo: InventoryRepository;

  constructor(catalogRepo: CatalogRepository, inventoryRepo: InventoryRepository) {
    this.catalogRepo = catalogRepo;
    this.inventoryRepo = inventoryRepo;
  }

  /**
   * Initializes the catalog and inventory.
   * Called once at start.
   * @param productInfo 
   */
  async initCatalog(productInfo: CatalogProduct[]) {
    for (const product of productInfo) {
      await this.catalogRepo.insertProduct(product);
      await this.inventoryRepo.createInventoryItem(product.product_id);
    }
  }

  /**
   * Returns a product from the catalog.
   * @param productId the ID of the product
   * @returns the product
   */
  async getProduct(productId: number) {
    return await this.catalogRepo.getProduct(productId);
  }
}