-- Add parent_id to categories and seed a two-level structure (safe, idempotent)
BEGIN;

-- Add parent_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='categories' AND column_name='parent_id'
  ) THEN
    ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(catid);
  END IF;
END$$;

-- Ensure high-level parents exist
INSERT INTO categories (catname) VALUES ('Điện tử') ON CONFLICT (catid) DO NOTHING;
INSERT INTO categories (catname) VALUES ('Thời trang') ON CONFLICT (catid) DO NOTHING;

-- Set some existing categories under the new parents
UPDATE categories
SET parent_id = (SELECT catid FROM categories WHERE catname = 'Điện tử')
WHERE catname IN ('Điện thoại', 'Máy chụp hình', 'Máy tính');

UPDATE categories
SET parent_id = (SELECT catid FROM categories WHERE catname = 'Thời trang')
WHERE catname IN ('Quần áo - Giày dép');

-- Insert child categories if not present
INSERT INTO categories (catname, parent_id)
SELECT 'Điện thoại di động', catid FROM categories WHERE catname = 'Điện tử' AND NOT EXISTS (SELECT 1 FROM categories WHERE catname = 'Điện thoại di động');

INSERT INTO categories (catname, parent_id)
SELECT 'Máy tính xách tay', catid FROM categories WHERE catname = 'Điện tử' AND NOT EXISTS (SELECT 1 FROM categories WHERE catname = 'Máy tính xách tay');

INSERT INTO categories (catname, parent_id)
SELECT 'Giày', catid FROM categories WHERE catname = 'Thời trang' AND NOT EXISTS (SELECT 1 FROM categories WHERE catname = 'Giày');

INSERT INTO categories (catname, parent_id)
SELECT 'Đồng hồ', catid FROM categories WHERE catname = 'Thời trang' AND NOT EXISTS (SELECT 1 FROM categories WHERE catname = 'Đồng hồ');

COMMIT;
