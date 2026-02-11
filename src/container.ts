/**
 * Composition root — wires all dependencies for the application.
 * This is the single place where classes are instantiated
 * and injected into their dependents.
 */

// Repositories
import { CatalogRepository } from './repositories/catalog.repository.ts';
import { InventoryRepository } from './repositories/inventory.repository.ts';
import { OrderRepository } from './repositories/order.repository.ts';

// Services
import { CatalogService } from './services/catalog.service.ts';
import { InventoryService } from './services/inventory.service.ts';
import { ShipmentService } from './services/shipment.service.ts';
import { OrderService } from './services/order.service.ts';

// Controllers
import { CatalogController } from './controllers/catalog.controller.ts';
import { InventoryController } from './controllers/inventory.controller.ts';
import { ShipmentController } from './controllers/shipment.controller.ts';
import { OrderController } from './controllers/order.controller.ts';


// ---------- Instantiation: ----------

// Repositories
const catalogRepo = new CatalogRepository();
const inventoryRepo = new InventoryRepository();
const orderRepo = new OrderRepository();

// Services
const catalogService = new CatalogService(catalogRepo, inventoryRepo);
const inventoryService = new InventoryService(inventoryRepo);
const shipmentService = new ShipmentService(catalogService);
const orderService = new OrderService(orderRepo, inventoryService, shipmentService);

// Controllers
export const catalogController = new CatalogController(catalogService);
export const inventoryController = new InventoryController(inventoryService, orderService);
export const shipmentController = new ShipmentController(shipmentService);
export const orderController = new OrderController(orderService);