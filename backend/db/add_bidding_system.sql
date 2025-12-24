-- Add rating columns to users table for bidder evaluation
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='positive_ratings') THEN
    ALTER TABLE public.users ADD COLUMN positive_ratings INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='negative_ratings') THEN
    ALTER TABLE public.users ADD COLUMN negative_ratings INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='total_ratings') THEN
    ALTER TABLE public.users ADD COLUMN total_ratings INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add bidding-related columns to products table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='bid_step') THEN
    ALTER TABLE public.products ADD COLUMN bid_step DECIMAL(15,2) DEFAULT 10000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='allow_unrated_bidders') THEN
    ALTER TABLE public.products ADD COLUMN allow_unrated_bidders BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Add missing columns to existing bids table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='bids' AND column_name='status') THEN
    ALTER TABLE public.bids ADD COLUMN status VARCHAR(20) DEFAULT 'active';
  END IF;
END $$;

-- Create additional index for bid_time if not exists
CREATE INDEX IF NOT EXISTS idx_bids_userid ON public.bids(userid);
CREATE INDEX IF NOT EXISTS idx_bids_bid_time ON public.bids(bid_time DESC);

-- Comments for documentation
COMMENT ON COLUMN users.positive_ratings IS 'Number of positive ratings received (+)';
COMMENT ON COLUMN users.negative_ratings IS 'Number of negative ratings received (-)';
COMMENT ON COLUMN users.total_ratings IS 'Total number of ratings (positive + negative)';
COMMENT ON COLUMN products.bid_step IS 'Minimum bid increment set by seller';
COMMENT ON COLUMN products.allow_unrated_bidders IS 'Allow bidders with no rating history';
