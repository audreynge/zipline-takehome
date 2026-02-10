CREATE TABLE IF NOT EXISTS products (
  product_id INTEGER PRIMARY KEY,
  product_name TEXT NOT NULL,
  mass_g INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  product_id INTEGER PRIMARY KEY REFERENCES products(product_id),
  quantity INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  quantity INTEGER NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

CREATE TABLE IF NOT EXISTS pending_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER REFERENCES products(product_id),
  quantity INTEGER NOT NULL
);