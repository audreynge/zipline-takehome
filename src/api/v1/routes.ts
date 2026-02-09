import { Router } from 'express';

const router = Router();

router.post('/init-catalog', (req, res) => {
  res.json({ message: 'Catalog initialized' });
});

router.post('/process-order', (req, res) => {
  res.json({ message: 'Order processed' });
});

router.post('/process-restock', (req, res) => {
  res.json({ message: 'Restocked successfully' });
});

router.post('/ship-package', (req, res) => {
  res.json({ message: 'Package shipped' });
});

export default router;