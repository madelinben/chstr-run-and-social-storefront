CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_provider TEXT NOT NULL,
  payment_reference TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('PAID_UNFULFILLED','ORDERED_FROM_SUPPLIER','READY_FOR_PICKUP','FULFILLED','REFUNDED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (payment_provider, payment_reference)
);

CREATE TABLE order_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_slug TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_pence INTEGER NOT NULL
);

CREATE INDEX order_lines_order_id ON order_lines (order_id);
CREATE INDEX orders_status ON orders (status);
