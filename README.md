# Zipline Inventory Management & Order Processing System

Zipline operates autonomous delivery vehicles out of nests. Each has an inventory of medical supplies. This system:

1. Manages a product catalog: registers which products can be stocked and ordered
2. Tracks inventory: records quantities of each product currently in stock
3. Processes orders: ships what is available immediately + defers the rest as pending
4. Handles restocks: adds inventory and automatically fulfills any pending orders
5. Splits packages: makes sure no shipment exceeds the 1.8 kg weight limit

### Key Constraints

- Max shipment weight: 1.8 kg
- Orders that can't be fully filled are partially shipped. Remaining items are deferred until a future restock
- `init_catalog` must be called once before any orders or restocks are processed

## Architecture

The project follows a layered architecture: **Routes → Controllers → Services → Repositories → Database**.

All dependencies are wired via **constructor injection**. A single composition root (`container.ts`) creates every repository, service, and controller, making the full dependency graph visible in one place and enabling easy testing with swapped implementations.

```
src/
|-- container.ts             # Wires all dependencies
|-- index.ts                 # Express app entry point
|-- api/v1/routes/           # Express route definitions
|   |-- index.ts             # route aggregator
|   |-- catalog.routes.ts
|   |-- inventory.routes.ts
|   |-- order.routes.ts
|   |-- shipment.routes.ts
|-- controllers/             # Request validation + response handling
|   |-- catalog.controller.ts
|   |-- inventory.controller.ts
|   |-- order.controller.ts
|   |-- shipment.controller.ts
|-- services/                # Business logic
|   |-- catalog.service.ts
|   |-- inventory.service.ts
|   |-- order.service.ts
|   |-- shipment.service.ts
|-- repositories/            # db access (sql queries)
|   |-- catalog.repository.ts
|   |-- inventory.repository.ts
|   |-- order.repository.ts
|-- models/                  # Typescript type definitions
|   |-- catalog.model.ts
|   |-- inventory.model.ts
|   |-- order.model.ts
|   |-- shipment.model.ts
|   |-- nest.model.ts
|-- database/
|   |-- connection.ts        # Postgres pool, schema init
|   |-- schema.sql           # Table definitions
|-- middleware/
    |-- app-error.ts         # custom error class
    |-- error.middleware.ts
```

### Tech Stack

- Express - server side routing
- PostgreSQL - store relational data
- Jest - testing

## Database Schema

| Table | Purpose |
|---|---|
| `products` | Product catalog (id, name, mass in grams) |
| `inventory` | Current stock quantity per product |
| `orders` | Orders received |
| `pending_order_items` | Unfulfilled order items, waiting to be restocked |

## API
(in the future, i would make a swagger doc for API referenece)

All endpoints are prefixed with `/api/v1`

### `POST /api/v1/init-catalog`

Initializes the catalog with incoming products and sets their quantity to 0.

**Request body:**

```json
[
  { "product_id": 0, "product_name": "RBC A+ Adult", "mass_g": 700 },
  { "product_id": 1, "product_name": "RBC B+ Adult", "mass_g": 700 }
]
```

**Response:**

```json
{ "success": true, "message": "Catalog initialized" }
```

---

### `GET /api/v1/get-product/:productId`

Returns a single product from the catalog.

**Response:** `200 OK`

```json
{ "product_id": 0, "product_name": "RBC A+ Adult", "mass_g": 700 }
```

---

### `POST /api/v1/process-order`

Submits a hospital order. Items in stock are shipped immediately (split into packages as needed). Items not in stock are saved as pending and fulfilled on the next restock.

**Request body:**

```json
{
  "order_id": 123,
  "requested": [
    { "product_id": 0, "quantity": 2 },
    { "product_id": 10, "quantity": 4 }
  ]
}
```

**Response:** `200 OK`

```json
{ "success": true, "message": "Order processed" }
```

Side effect: Calls `ship_package` for each package that can be shipped.

---

### `POST /api/v1/process-restock`

Adds inventory and immediately attempts to fulfill any pending orders.

**Request body:**

```json
[
  { "product_id": 0, "quantity": 30 },
  { "product_id": 1, "quantity": 25 }
]
```

**Response:** `200 OK`

```json
{ "success": true, "message": "Restocked successfully" }
```

Side effect: Pending orders are re-evaluated and shipped if stock is now available.

---

### `POST /api/v1/ship-package`

Directly ships a package (prints to console). Primarily used internally by the order/restock flow.

**Request body:**

```json
{
  "order_id": 123,
  "shipped": [
    { "product_id": 0, "quantity": 1 },
    { "product_id": 10, "quantity": 2 }
  ]
}
```

**Response:** `200 OK`

```json
{ "success": true, "message": "Package shipped" }
```

## Get started

### Prerequisites

- Node.js
- PostgreSQL

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/audreynge/zipline-takehome.git
   cd zipline-takehome
   ```

2. **Install dependencies**

   ```bash
   cd src
   npm i
   ```

3. **Configure env variables**

   ```bash
   cp .env.example .env
   ```

   edit `.env` with YOUR postgres connection string

4. **Start the server!**

   ```bash
   npm run dev
   ```

### Example Workflow

```bash
# 1. Initialize the catalog
curl -X POST http://localhost:4000/api/v1/init-catalog \
  -H "Content-Type: application/json" \
  -d '[
    {"product_id": 0, "product_name": "RBC A+ Adult", "mass_g": 700},
    {"product_id": 1, "product_name": "RBC B+ Adult", "mass_g": 700},
    {"product_id": 10, "product_name": "FFP A+", "mass_g": 300}
  ]'

# 2. Restock inventory
curl -X POST http://localhost:4000/api/v1/process-restock \
  -H "Content-Type: application/json" \
  -d '[{"product_id": 0, "quantity": 10}, {"product_id": 10, "quantity": 5}]'

# 3. Place an order (ships immediately since stock is available)
curl -X POST http://localhost:4000/api/v1/process-order \
  -H "Content-Type: application/json" \
  -d '{"order_id": 123, "requested": [{"product_id": 0, "quantity": 2}, {"product_id": 10, "quantity": 4}]}'
```

## Running Tests

Tests are in the `tests/` directory and use Jest.

```bash
cd tests
npm i
npm test
```

### Test layers

| Layer | What it tests | Mocking strategy |
|---|---|---|
| Repository unit tests (`tests/repositories/`) | SQL query construction, parameter passing | Mocks `pool.query` |
| Service unit tests (`tests/services/`) | Business logic in isolation | Injects mock objects via constructor |
| e2e tests (`tests/e2e/`) | Full workflows across all services | Injects in-memory fake repositories via constructor, no mocking framework needed |

## Design Decisions

- **Layered architecture** - separates HTTP concerns (controllers) from business logic (services) and data access (repositories). This allows each layer to be independently testable.
- **Constructor-based dependency injection** — every service and controller receives its dependencies through the constructor (rather than creating them internally). A single composition root (`container.ts`) wires the production graph. This makes it straightforward to swap implementations (e.g., in-memory fakes for testing, or a different database adapter in the future) without modifying service code.
- **Pending order tracking** — orders that can't be fully fulfilled are in `pending_order_items` so they survive server restarts and are automatically retried on restock.
- **Greedy package splitting** — the shipment service packs items into packages using a first-fit greedy algorithm. When the next item won't fit, a new package is started.
- **Idempotent catalog initialization** — `init_catalog` uses `ON CONFLICT DO NOTHING` so it can be safely retried without causing duplicate key errors.
- **Defensive inventory updates** — `removeStock` has `WHERE quantity >= $1` to prevent inventory from going negative.
- **PostgreSQL** — data durability and referential integrity (foreign keys) over an in-memory store, which would lose state on restart.
- **Extensibility hooks** — some models have commented placeholders for future features like multi-nest support (`nest_id`) and multiple catalogs (`catalog_id`).

## Known Limitations & Future Work

Tradeoffs I made for this take home and what I would prioritize next for a production system.

### No database transactions

Operations like `processOrder` involve multiple sequential database writes (check inventory, decrement stock, record the order, save pending items). These aren't currently wrapped in a database transaction. If the server crashed mid-operation, the database could be in an inconsistent state. For example, stock could be decremented without the corresponding pending order being recorded. In production, these multi-step operations should be wrapped in a `BEGIN / COMMIT` transaction for atomicity.

### Limited concurrency handling

The current flow reads the inventory quantity and then decrements it in separate queries. If two requests arrive simultaneously for the same product, they could both read the same stock level and both attempt to ship, potentially overselling. The `WHERE quantity >= $1` guard on `removeStock` prevents negative inventory at the SQL level, but the second request would fail to decrement rather than correctly defer. A production fix would use `SELECT ... FOR UPDATE` in a transaction to lock the inventory row while processing.

### No duplicate order protection

Submitting the same `order_id` twice will result in a primary key violation on the `orders` table. In a production system with network retries, this should be handled gracefully either with `ON CONFLICT` handling or by checking for an existing order before processing.

### Additional improvements for production

- **Better logging** — replace `console.log` with a proper logging library
- **Input validation** — validate that product IDs in orders and restocks exist in the catalog before processing
- **Database migrations** — replace the raw `schema.sql` with a migration tool
- **API authentication** — add auth middleware to protect endpoints
- **Monitoring & health checks** — add a `/health` endpoint and metrics for shipment, pending order backlog, etc
- **Containerization** - Dockerize the app and db so it can be deployed consistenly across different environments and simplify CI/CD pipelines
- **Microservices** - In production, traffic would grow. Splitting the system into diff services (catalog service, order service, etc) would allow each service to scale independently