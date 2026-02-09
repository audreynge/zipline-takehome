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
    try {
      for (const item of restock) {
        await this.inventoryRepo.addStock(item.product_id, item.quantity);
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to process stock');
    }
  }

  /**
   * Removes stock from a product in the inventory.
   * @param productId the ID of the product
   * @param quantity the quantity of stock to remove
   */
  async removeStock(productId: number, quantity: number) {
    try {
      await this.inventoryRepo.removeStock(productId, quantity);
    } catch (error) {
      console.error(error);
      throw new Error('Failed to remove stock');
    }
  }

  /**
   * Returns the quantity of a product in the inventory.
   * @param productId the ID of the product
   * @returns quantity of the product
   */
  async getQuantity(productId: number) {
    try {
      return await this.inventoryRepo.getQuantity(productId);
    } catch (error) {
      console.error(error);
      throw new Error('Failed to get quantity');
    }
  }
}