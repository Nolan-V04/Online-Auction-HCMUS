-- Remove duplicate rating columns from bid_permission_requests table
-- Ratings should be fetched from users table via JOIN, not stored redundantly

-- First, check if columns exist and drop them
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'bid_permission_requests' 
               AND column_name = 'bidder_positive_ratings') THEN
        ALTER TABLE bid_permission_requests DROP COLUMN bidder_positive_ratings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'bid_permission_requests' 
               AND column_name = 'bidder_negative_ratings') THEN
        ALTER TABLE bid_permission_requests DROP COLUMN bidder_negative_ratings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'bid_permission_requests' 
               AND column_name = 'bidder_total_ratings') THEN
        ALTER TABLE bid_permission_requests DROP COLUMN bidder_total_ratings;
    END IF;
END $$;

-- Keep bidder_name and bidder_email for display purposes (denormalization is OK here)
-- But ratings should always come from the users table via JOIN

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bid_permission_requests' 
ORDER BY ordinal_position;
