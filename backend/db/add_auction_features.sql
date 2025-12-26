/*
 Add auction features to products table:
 - seller_id: người bán sản phẩm
 - starting_price: giá khởi điểm
 - bid_step: bước giá
 - buy_now_price: giá mua ngay (nullable)
 - auto_extend: tự động gia hạn (boolean)
 - images: mảng URL ảnh (JSONB hoặc TEXT[])
 - status: trạng thái sản phẩm (pending, active, ended, sold)
 
 Create auction_settings table for admin configuration
*/

-- Add new columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS starting_price BIGINT,
ADD COLUMN IF NOT EXISTS bid_step BIGINT DEFAULT 100000,
ADD COLUMN IF NOT EXISTS buy_now_price BIGINT,
ADD COLUMN IF NOT EXISTS auto_extend BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS images TEXT[],
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Create index for seller queries
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Create auction_settings table for admin configuration
CREATE TABLE IF NOT EXISTS auction_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value INTEGER NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default auction settings
INSERT INTO auction_settings (setting_key, setting_value, description) VALUES
  ('auto_extend_minutes_before_end', 5, 'Số phút trước khi kết thúc để kích hoạt gia hạn tự động'),
  ('auto_extend_duration_minutes', 10, 'Số phút gia hạn thêm khi có bid mới')
ON CONFLICT (setting_key) DO NOTHING;

-- Update existing products to have a seller (for testing, assign to user 2 - seller)
UPDATE products 
SET seller_id = 2, 
    starting_price = price,
    images = ARRAY[
      'https://via.placeholder.com/400x400?text=Product+Image+1',
      'https://via.placeholder.com/400x400?text=Product+Image+2',
      'https://via.placeholder.com/400x400?text=Product+Image+3'
    ]
WHERE seller_id IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN products.seller_id IS 'ID của người bán sản phẩm';
COMMENT ON COLUMN products.starting_price IS 'Giá khởi điểm đấu giá';
COMMENT ON COLUMN products.bid_step IS 'Bước giá tối thiểu cho mỗi lần đấu giá';
COMMENT ON COLUMN products.buy_now_price IS 'Giá mua ngay (nullable)';
COMMENT ON COLUMN products.auto_extend IS 'Có tự động gia hạn khi có bid mới gần thời gian kết thúc';
COMMENT ON COLUMN products.images IS 'Mảng URL ảnh sản phẩm';
COMMENT ON COLUMN products.status IS 'Trạng thái: pending, active, ended, sold';

COMMENT ON TABLE auction_settings IS 'Cài đặt hệ thống đấu giá do admin quản lý';
