import { Router } from 'express';
import { ShipmentController } from '../../../controllers/shipment.controller.ts';

const router = Router();
const shipmentController = new ShipmentController();

router.post('/ship-package', shipmentController.shipPackage.bind(shipmentController));

export default router;