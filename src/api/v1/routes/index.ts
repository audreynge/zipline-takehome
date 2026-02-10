import { Router } from 'express';
import catalogRoutes from './catalog.routes.ts';
import inventoryRoutes from './inventory.routes.ts';
import orderRoutes from './order.routes.ts';
import shipmentRoutes from './shipment.routes.ts';

const router = Router();

router.use('/', catalogRoutes);
router.use('/', inventoryRoutes);
router.use('/', orderRoutes);
router.use('/', shipmentRoutes);

export default router;