import { Router } from 'express';
import { CatalogController } from '../../../controllers/catalog.controller.ts';

const router = Router();
const catalogController = new CatalogController();

router.post('/init-catalog', catalogController.initCatalog.bind(catalogController));
router.get('/get-product/:productId', catalogController.getProduct.bind(catalogController));

export default router;