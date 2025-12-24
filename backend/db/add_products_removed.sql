-- Migration: add 'removed' flag to products for admin to remove items
ALTER TABLE products ADD COLUMN IF NOT EXISTS removed BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_products_removed ON products(removed);
