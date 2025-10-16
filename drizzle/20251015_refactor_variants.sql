-- 20251015_refactor_variants.sql
-- Refactor for product variants:
-- - Add listing_variants
-- - Remove price/images/video from listings
-- - Replace sales.listing_id -> sales.variant_id

PRAGMA foreign_keys=OFF;

-----------------------------
-- 1) New: listing_variants
-----------------------------
CREATE TABLE IF NOT EXISTS listing_variants (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id        INTEGER NOT NULL,
  name              TEXT NOT NULL,                 -- e.g. "Red / Medium"
  sku               TEXT,                          -- optional
  price             REAL NOT NULL,                 -- per-variant price
  stock             INTEGER NOT NULL DEFAULT 0,    -- per-variant stock
  attributes        TEXT NOT NULL,                 -- JSON: {"size":"M","color":"Red"}
  images            TEXT,                          -- JSON array of URLs (Cloudinary)
  is_active         INTEGER NOT NULL DEFAULT 1,    -- boolean 0/1
  created_at        INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at        INTEGER NOT NULL DEFAULT (unixepoch()),
  CONSTRAINT fk_listing_variants_listing
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Helpful indexes & constraints
CREATE INDEX IF NOT EXISTS idx_listing_variants_listing_id ON listing_variants(listing_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_variants_sku_unique ON listing_variants(sku) WHERE sku IS NOT NULL;

-----------------------------
-- 2) Refactor: listings
--    Remove variant-specific fields: price, images, video
-----------------------------
-- Rebuild the listings table without the dropped columns (SQLite limitation)
CREATE TABLE IF NOT EXISTS _listings_new (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'new',
  vendor_id     INTEGER NOT NULL,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  category      TEXT,
  sub_category  TEXT,
  tags          TEXT,
  is_featured   INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT fk_listings_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- If you were preserving data, you'd INSERT ... SELECT (excluding price/images/video) here.

DROP TABLE listings;
ALTER TABLE _listings_new RENAME TO listings;

-- Recreate helpful indexes if you had any (examples):
-- CREATE INDEX IF NOT EXISTS idx_listings_vendor_id ON listings(vendor_id);
-- CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);

-----------------------------
-- 3) Refactor: sales
--    Replace listing_id with variant_id
-----------------------------
CREATE TABLE IF NOT EXISTS _sales_new (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id              INTEGER NOT NULL,
  vendor_id               INTEGER NOT NULL,
  amount                  REAL NOT NULL,
  sale_date               INTEGER NOT NULL,
  created_at              INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at              INTEGER NOT NULL DEFAULT (unixepoch()),
  status                  TEXT NOT NULL DEFAULT 'pending',
  payment_status          TEXT NOT NULL DEFAULT 'pending',
  payment_method          TEXT NOT NULL DEFAULT 'cash',
  payment_date            INTEGER,
  payment_amount          REAL NOT NULL,
  payment_currency        TEXT NOT NULL DEFAULT 'USD',
  payment_transaction_id  TEXT,
  CONSTRAINT fk_sales_variant
    FOREIGN KEY (variant_id) REFERENCES listing_variants(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_sales_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- If preserving data, you'd transform listing_id -> appropriate variant_id here.

DROP TABLE sales;
ALTER TABLE _sales_new RENAME TO sales;

-- Optional index examples:
CREATE INDEX IF NOT EXISTS idx_sales_variant_id ON sales(variant_id);
CREATE INDEX IF NOT EXISTS idx_sales_vendor_id ON sales(vendor_id);

PRAGMA foreign_keys=ON;
