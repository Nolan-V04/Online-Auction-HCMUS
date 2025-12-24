-- Add watchlist column to users table
-- This will store an array of product IDs that user has added to their watchlist

ALTER TABLE public.users 
ADD COLUMN watchlist INTEGER[] DEFAULT '{}';

-- Create an index for better query performance when searching for products in watchlist
CREATE INDEX idx_users_watchlist ON public.users USING GIN (watchlist);

-- Example queries:
-- Check if a product is in user's watchlist:
-- SELECT * FROM users WHERE id = 1 AND 123 = ANY(watchlist);

-- Add a product to watchlist:
-- UPDATE users SET watchlist = array_append(watchlist, 123) WHERE id = 1 AND NOT (123 = ANY(watchlist));

-- Remove a product from watchlist:
-- UPDATE users SET watchlist = array_remove(watchlist, 123) WHERE id = 1;
