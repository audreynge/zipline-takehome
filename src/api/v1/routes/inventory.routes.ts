import { Router } from 'express';
import { InventoryController } from '../../../controllers/inventory.controller.ts';

const router = Router();
const inventoryController = new InventoryController();

router.post('/process-restock', inventoryController.processRestock.bind(inventoryController));

export default router;