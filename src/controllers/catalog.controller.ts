import { CatalogService } from '../services/catalog.service.ts';
import type { Request, Response } from 'express';
import { AppError } from '../middleware/app-error.ts';

export class CatalogController {
  private catalogService: CatalogService;

  constructor() {
    this.catalogService = new CatalogService();
  }

  /**
   * Initializes the catalog and inventory.
   * @param productInfo the list of products to be initialized
   */
  async initCatalog(req: Request, res: Response) {
    const productInfo = Array.isArray(req.body) ? req.body : req.body.productInfo;
    if (!Array.isArray(productInfo)) {
      throw new AppError('Expected an array of products', 400);
    }

    await this.catalogService.initCatalog(productInfo);
    res.status(200).json({ success: true, message: 'Catalog initialized' });
  }

  /**
   * Returns a product from the catalog.
   * @param productId the ID of the product
   * @returns the product
   */
  async getProduct(req: Request, res: Response) {
    const product = await this.catalogService.getProduct(Number(req.params.productId));
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    res.status(200).json(product);
  }
}