import { Router } from 'express';
import { OrderController } from '../../../controllers/order.controller.ts';

const router = Router();
const orderController = new OrderController();

router.post('/process-order', orderController.processOrder.bind(orderController));

export default router;