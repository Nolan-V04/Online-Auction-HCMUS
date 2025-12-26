-- Create bid_permission_requests table for bidders requesting permission to bid
CREATE TABLE IF NOT EXISTS bid_permission_requests (
  request_id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(proid) ON DELETE CASCADE,
  bidder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bidder_name VARCHAR(100) NOT NULL,
  bidder_email VARCHAR(255),
  bidder_positive_ratings INTEGER DEFAULT 0,
  bidder_negative_ratings INTEGER DEFAULT 0,
  bidder_total_ratings INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  UNIQUE(product_id, bidder_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bid_permission_requests_product_id ON bid_permission_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_bid_permission_requests_bidder_id ON bid_permission_requests(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bid_permission_requests_status ON bid_permission_requests(status);
