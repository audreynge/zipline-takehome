import { InventoryRepository } from '../repositories/inventory.repository.ts';

export class InventoryService {
  private inventoryRepo: InventoryRepository;

  constructor() {
    this.inventoryRepo = new InventoryRepository();
  }

  /**
   * Processes a restock of products.
   * @param restock the list of products to be restocked
   */
  async processStock(restock: { product_id: number, quantity: number }[]) {
    for (const item of restock) {
      await this.inventoryRepo.addStock(item.product_id, item.quantity);
    }
  }

  /**
   * Removes stock from a product in the inventory.
   * @param productId the ID of the product
   * @param quantity the quantity of stock to remove
   */
  async removeStock(productId: number, quantity: number) {
    await this.inventoryRepo.removeStock(productId, quantity);
  }

  /**
   * Returns the quantity of a product in the inventory.
   * @param productId the ID of the product
   * @returns quantity of the product
   */
  async getQuantity(productId: number) {
    return await this.inventoryRepo.getQuantity(productId);
  }
}