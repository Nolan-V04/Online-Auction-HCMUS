-- Table to store rejected bidders for specific products
CREATE TABLE IF NOT EXISTS rejected_bidders (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(proid) ON DELETE CASCADE,
  bidder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rejected_by INTEGER NOT NULL REFERENCES users(id), -- seller who rejected
  UNIQUE(product_id, bidder_id)
);

CREATE INDEX idx_rejected_bidders_product ON rejected_bidders(product_id);
CREATE INDEX idx_rejected_bidders_bidder ON rejected_bidders(bidder_id);
