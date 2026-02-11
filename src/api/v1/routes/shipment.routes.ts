import { Router } from 'express';
import { shipmentController } from '../../../container.ts';

const router = Router();

router.post('/ship-package', shipmentController.shipPackage.bind(shipmentController));

export default router;