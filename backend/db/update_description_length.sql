-- Migration to increase tinydes length to support HTML content
-- Run this migration to update the database schema

ALTER TABLE products 
ALTER COLUMN tinydes TYPE TEXT;

-- Optional: Add comment to document the change
COMMENT ON COLUMN products.tinydes IS 'Short description (supports HTML from WYSIWYG editor)';
COMMENT ON COLUMN products.fulldes IS 'Full description (supports HTML from WYSIWYG editor)';
