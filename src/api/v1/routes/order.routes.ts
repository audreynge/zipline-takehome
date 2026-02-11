import { Router } from 'express';
import { orderController } from '../../../container.ts';

const router = Router();

router.post('/process-order', orderController.processOrder.bind(orderController));

export default router;