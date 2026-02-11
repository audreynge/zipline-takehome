import { Router } from 'express';
import { catalogController } from '../../../container.ts';

const router = Router();

router.post('/init-catalog', catalogController.initCatalog.bind(catalogController));
router.get('/get-product/:productId', catalogController.getProduct.bind(catalogController));

export default router;