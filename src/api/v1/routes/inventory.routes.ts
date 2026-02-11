import { Router } from 'express';
import { inventoryController } from '../../../container.ts';

const router = Router();

router.post('/process-restock', inventoryController.processRestock.bind(inventoryController));

export default router;