import type { Request, Response } from 'express';
import type { ShipmentService } from '../services/shipment.service.ts';
import { AppError } from '../middleware/app-error.ts';
import type { Shipment } from '../models/shipment.model.ts';

export class ShipmentController {
  private shipmentService: ShipmentService;

  constructor(shipmentService: ShipmentService) {
    this.shipmentService = shipmentService;
  }

  async shipPackage(req: Request, res: Response) {
    const shipment = req.body as Shipment;
    if (!shipment || typeof shipment.order_id !== 'number' || !Array.isArray(shipment.shipped)) {
      throw new AppError('Expected a shipment with order_id and shipped items', 400);
    }

    await this.shipmentService.shipPackage(shipment);
    res.status(200).json({ success: true, message: 'Package shipped' });
  }
}
