-- Debug script to check bid_permission_requests status

-- 1. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bid_permission_requests' 
ORDER BY ordinal_position;

-- 2. Check all permission requests
SELECT 
    bpr.*,
    u.username as actual_username,
    u.positive_ratings as actual_positive,
    u.negative_ratings as actual_negative,
    u.total_ratings as actual_total
FROM bid_permission_requests bpr
LEFT JOIN users u ON bpr.bidder_id = u.id
ORDER BY bpr.requested_at DESC;

-- 3. Check approved permissions specifically
SELECT 
    bpr.request_id,
    bpr.product_id,
    bpr.bidder_id,
    bpr.bidder_name,
    bpr.status,
    bpr.requested_at,
    u.username,
    u.positive_ratings,
    u.negative_ratings,
    u.total_ratings
FROM bid_permission_requests bpr
LEFT JOIN users u ON bpr.bidder_id = u.id
WHERE bpr.status = 'approved';
