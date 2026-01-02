-- ===========================
-- Order Completion System
-- ===========================

-- Table for order completion process
CREATE TABLE IF NOT EXISTS order_completion (
  id SERIAL PRIMARY KEY,
  proid INTEGER NOT NULL REFERENCES products(proid) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES users(id),
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  
  -- Step tracking
  current_step INTEGER DEFAULT 1, -- 1: payment, 2: shipping, 3: received, 4: rating
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, cancelled
  
  -- Step 1: Buyer provides payment proof and shipping address
  payment_proof TEXT, -- URL or base64 encoded image
  shipping_address TEXT,
  payment_submitted_at TIMESTAMP,
  
  -- Step 2: Seller confirms payment and provides shipping info
  shipping_invoice TEXT, -- Tracking number or invoice
  shipping_confirmed_at TIMESTAMP,
  
  -- Step 3: Buyer confirms received goods
  goods_received_at TIMESTAMP,
  
  -- Step 4: Ratings (can be updated anytime)
  buyer_rating INTEGER, -- 1 (positive) or -1 (negative)
  buyer_rating_comment TEXT,
  buyer_rated_at TIMESTAMP,
  
  seller_rating INTEGER, -- 1 (positive) or -1 (negative)  
  seller_rating_comment TEXT,
  seller_rated_at TIMESTAMP,
  
  -- Transaction cancellation
  cancelled_by INTEGER REFERENCES users(id),
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(proid)
);

-- Table for chat messages between buyer and seller
CREATE TABLE IF NOT EXISTS order_chat (
  id SERIAL PRIMARY KEY,
  order_completion_id INTEGER NOT NULL REFERENCES order_completion(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_completion_proid ON order_completion(proid);
CREATE INDEX IF NOT EXISTS idx_order_completion_seller ON order_completion(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_completion_buyer ON order_completion(buyer_id);
CREATE INDEX IF NOT EXISTS idx_order_completion_status ON order_completion(status);
CREATE INDEX IF NOT EXISTS idx_order_chat_order ON order_chat(order_completion_id);
CREATE INDEX IF NOT EXISTS idx_order_chat_sender ON order_chat(sender_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_order_completion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS trigger_update_order_completion_timestamp ON order_completion;
CREATE TRIGGER trigger_update_order_completion_timestamp
  BEFORE UPDATE ON order_completion
  FOR EACH ROW
  EXECUTE FUNCTION update_order_completion_timestamp();

-- Add fields to products table if they don't exist
DO $$ 
BEGIN
  -- Track if product auction is completed and has winner
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='auction_completed') THEN
    ALTER TABLE products ADD COLUMN auction_completed BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Track the winning bid amount (final price)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='final_price') THEN
    ALTER TABLE products ADD COLUMN final_price BIGINT;
  END IF;
END $$;

-- Add rating fields to users table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='positive_ratings') THEN
    ALTER TABLE users ADD COLUMN positive_ratings INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='negative_ratings') THEN
    ALTER TABLE users ADD COLUMN negative_ratings INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='total_ratings') THEN
    ALTER TABLE users ADD COLUMN total_ratings INTEGER DEFAULT 0;
  END IF;
END $$;

-- View to get order completion with user details
CREATE OR REPLACE VIEW v_order_completion_details AS
SELECT 
  oc.*,
  s.username as seller_username,
  s.name as seller_name,
  s.email as seller_email,
  b.username as buyer_username,
  b.name as buyer_name,
  b.email as buyer_email,
  p.proname,
  p.final_price,
  p.buy_now_price,
  p.end_time
FROM order_completion oc
JOIN users s ON oc.seller_id = s.id
JOIN users b ON oc.buyer_id = b.id
JOIN products p ON oc.proid = p.proid;

COMMENT ON TABLE order_completion IS 'Tracks the order completion process after auction ends';
COMMENT ON TABLE order_chat IS 'Chat messages between buyer and seller during order completion';
COMMENT ON COLUMN order_completion.current_step IS '1=payment, 2=shipping, 3=received, 4=rating';
COMMENT ON COLUMN order_completion.status IS 'in_progress, completed, cancelled';
