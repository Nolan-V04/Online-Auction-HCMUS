/*
 Updated SQL dump with auction support:
 - Adds `end_time`, `bid_count`, `created_at` to `products` (with defaults)
 - Creates `bids` table (references `products` and `users`)
 - Adds test users so bid seeds won't violate FKs
 - Adds bid and end_time seed data and updates `bid_count`
 - Adds helpful indexes
*/

-- Drop tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS orderdetails CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS userrefreshtokenext CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------
-- Table structure for categories
-- ----------------------------
CREATE TABLE categories (
  catid SERIAL PRIMARY KEY,
  catname VARCHAR(50) NOT NULL
);

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO categories (catid, catname) VALUES 
(1, 'Sách'),
(2, 'Điện thoại'),
(3, 'Máy chụp hình'),
(4, 'Quần áo - Giày dép'),
(5, 'Máy tính'),
(6, 'Đồ trang sức'),
(7, 'Khác')
ON CONFLICT (catid) DO NOTHING;

-- Reset sequence to continue from 8
SELECT setval('categories_catid_seq', 7);

-- ----------------------------
-- Table structure for products (added end_time, bid_count, created_at)
-- ----------------------------
CREATE TABLE products (
  proid SERIAL PRIMARY KEY,
  proname VARCHAR(50) NOT NULL,
  tinydes VARCHAR(100) NOT NULL,
  fulldes TEXT NOT NULL,
  price INTEGER NOT NULL,
  catid INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  end_time TIMESTAMP NULL,
  bid_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (catid) REFERENCES categories(catid)
);

-- ----------------------------
-- Records of products (unchanged values; new columns use defaults)
-- ----------------------------
INSERT INTO products (proid, proname, tinydes, fulldes, price, catid, quantity) VALUES 
(1, 'Freshwater Cultured Pearl', 'Freshwater Cultured Pearl, Citrine, Peridot & Amethyst Bracelet, 7.5"', '<UL>\n    <LI>Metal stamp: 14k </LI>\n    <LI>Metal: yellow-ld</LI>\n    <LI>Material Type: amethyst, citrine, ld, pearl, peridot</LI>\n    <LI>Gem Type: citrine, peridot, amethyst</LI>\n    <LI>Length: 7.5 inches</LI>\n    <LI>Clasp Type: filigree-box</LI>\n    <LI>Total metal weight: 0.6 Grams</LI>\n</UL>\n<STRONG>Pearl Information</STRONG><BR>\n<UL>\n    <LI>Pearl type: freshwater-cultured</LI>\n</UL>\n<STRONG>Packaging Information</STRONG><BR>\n<UL>\n    <LI>Package: Regal Blue Sueded-Cloth Pouch</LI>\n</UL>', 1500000, 6, 83),

(2, 'Pink Sapphire Sterling Silver', '14 1/2 Carat Created Pink Sapphire Sterling Silver Bracelet w/ Diamond Accents', '<P><STRONG>Jewelry Information</STRONG></P>\n<UL>\n    <LI>Loại hàng: Hàng trong nước</LI>\n</UL>', 300000, 6, 64),

(3, 'Torrini KC241', 'Nhẫn kim cương - vẻ đẹp kiêu sa', '<P>Không chỉ có kiểu dáng truyền thống chỉ có một hạt kim cương ở giữa, các nhà thiết kế đã tạo những những chiếc nhẫn vô cùng độc đáo và tinh tế. Tuy nhiên, giá của đồ trang sức này thì chỉ có dân chơi mới có thể kham được.</P>\n<UL>\n    <LI>Kiểu sản phẩm: Nhẫn nữ</LI>\n    <LI>Loại đá: To paz</LI>\n    <LI>Chất liệu: kim cương, nguyên liệu và công nghệ Italy...</LI>\n    <LI>Đơn giá: 2,110,250 VND / Chiếc</LI>\n</UL>', 1600000000, 6, 86),

(4, 'Torrini KC242', 'tinh xảo và sang trọng', '<P>Để sở hữu một chiếc nhẫn kim cương lấp lánh trên tay, bạn phải là người chịu chi và sành điệu.<BR>\nVới sự kết hợp khéo léo và độc đáo giữa kim cương và Saphia, Ruby... những chiếc nhẫn càng trở nên giá trị.</P>\n<UL>\n    <LI>Kiểu sản phẩm: Nhẫn nam</LI>\n    <LI>Loại đá: To paz</LI>\n    <LI>Chất liệu: Vàng tây 24K, nguyên liệu và công nghệ Italy...</LI>\n</UL>', 42000000, 6, 63),

(5, 'Nokia 7610', 'Độ phân giải cao, màn hình màu, chụp ảnh xuất sắc.', '<UL>\n    <LI>Máy ảnh có độ phân giải 1 megapixel</LI>\n    <LI>Màn hình 65.536 màu, rộng 2,1 inch, 176 X 208 pixel với độ họa sắc nét, độ phân giải cao</LI>\n    <LI>Quay phim video lên đến 10 phút với hình ảnh sắc nét hơn</LI>\n    <LI>Kinh nghiệm đa phương tiện được tăng cường</LI>\n    <LI>Streaming video &amp; âm thanh với RealOne Player (hỗ trợ các dạng thức MP3/AAC).</LI>\n    <LI>Nâng cấp cho những đoạn phim cá nhân của bạn bằng các tính năng chỉnh sửa tự động thông minh</LI>\n    <LI>In ảnh chất lượng cao từ nhà, văn phòng, kios và qua mạng</LI>\n    <LI>Dễ dàng kết nối với máy PC để lưu trữ và chia sẻ (bằng cáp USB, PopPort, công nghệ Bluetooth)</LI>\n    <LI>48 nhạc chuông đa âm sắc, True tones. Mạng GSM 900 / GSM 1800 / GSM 1900</LI>\n    <LI>Kích thước 109 x 53 x 19 mm, 93 cc</LI>\n    <LI>Trọng lượng 118 g</LI>\n    <LI>Hiển thị: Loại TFT, 65.536 màu</LI>\n    <LI>Kích cỡ: 176 x 208 pixels </LI>\n</UL>', 2900000, 2, 0);

-- Reset sequence to continue from last proid
SELECT setval('products_proid_seq', (SELECT COALESCE(MAX(proid), 1) FROM products));

-- ----------------------------
-- Table structure for users
-- ----------------------------
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(50) NOT NULL UNIQUE,
  dob DATE NOT NULL,
  permission INTEGER NOT NULL DEFAULT 0
);

-- ----------------------------
-- Insert test users (to allow bids seeding and dev/test accounts)
-- ----------------------------
INSERT INTO users (id, username, password, name, email, dob, permission) VALUES
  (1, 'user1', 'password1', 'User One', 'user1@example.com', '1990-01-01', 0),
  (2, 'user2', 'password2', 'User Two', 'user2@example.com', '1991-02-02', 0),
  (3, 'user3', 'password3', 'User Three', 'user3@example.com', '1992-03-03', 0),
  (4, 'user4', 'password4', 'User Four', 'user4@example.com', '1993-04-04', 0),
  (5, 'user5', 'password5', 'User Five', 'user5@example.com', '1994-05-05', 0)
ON CONFLICT (id) DO NOTHING;

-- Reset users sequence
SELECT setval(pg_get_serial_sequence('users','id'), (SELECT COALESCE(MAX(id), 1) FROM users));

-- ----------------------------
-- Table structure for orders
-- ----------------------------
CREATE TABLE orders (
  orderid SERIAL PRIMARY KEY,
  orderdate TIMESTAMP NOT NULL,
  userid INTEGER NOT NULL,
  total BIGINT NOT NULL,
  FOREIGN KEY (userid) REFERENCES users(id)
);

-- ----------------------------
-- Table structure for orderdetails
-- ----------------------------
CREATE TABLE orderdetails (
  id SERIAL PRIMARY KEY,
  orderid INTEGER NOT NULL,
  proid INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price BIGINT NOT NULL,
  amount INTEGER NOT NULL,
  FOREIGN KEY (orderid) REFERENCES orders(orderid),
  FOREIGN KEY (proid) REFERENCES products(proid)
);

-- ----------------------------
-- Table structure for bids (new)
-- ----------------------------
CREATE TABLE bids (
  bidid SERIAL PRIMARY KEY,
  proid INTEGER NOT NULL REFERENCES products(proid) ON DELETE CASCADE,
  userid INTEGER REFERENCES users(id),
  amount BIGINT NOT NULL,
  bid_time TIMESTAMP DEFAULT NOW()
);

-- ----------------------------
-- Table structure for userrefreshtokenext
-- ----------------------------
CREATE TABLE userrefreshtokenext (
  id INTEGER PRIMARY KEY,
  refreshtoken VARCHAR(255) NOT NULL,
  rdt TIMESTAMP(6) NOT NULL,
  FOREIGN KEY (id) REFERENCES users(id)
);

-- ----------------------------
-- Seed end_time values and bids for testing
-- ----------------------------
-- set end times (some soon, some later)
UPDATE products SET end_time = NOW() + INTERVAL '1 hour' WHERE proid = 3; -- ends in 1h
UPDATE products SET end_time = NOW() + INTERVAL '2 hour' WHERE proid = 25;
UPDATE products SET end_time = NOW() + INTERVAL '4 hour' WHERE proid = 13;
UPDATE products SET end_time = NOW() + INTERVAL '6 hour' WHERE proid = 16;
UPDATE products SET end_time = NOW() + INTERVAL '24 hour' WHERE proid = 6;

-- Add some bid rows (insert only when referenced product and user exist)
INSERT INTO bids (proid, userid, amount)
SELECT 3, 1, 2000000
WHERE EXISTS (SELECT 1 FROM products WHERE proid = 3)
  AND EXISTS (SELECT 1 FROM users WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM bids WHERE proid = 3 AND userid = 1 AND amount = 2000000);

INSERT INTO bids (proid, userid, amount)
SELECT 3, 2, 2200000
WHERE EXISTS (SELECT 1 FROM products WHERE proid = 3)
  AND EXISTS (SELECT 1 FROM users WHERE id = 2)
  AND NOT EXISTS (SELECT 1 FROM bids WHERE proid = 3 AND userid = 2 AND amount = 2200000);

INSERT INTO bids (proid, userid, amount)
SELECT 3, 3, 2300000
WHERE EXISTS (SELECT 1 FROM products WHERE proid = 3)
  AND EXISTS (SELECT 1 FROM users WHERE id = 3)
  AND NOT EXISTS (SELECT 1 FROM bids WHERE proid = 3 AND userid = 3 AND amount = 2300000);

INSERT INTO bids (proid, userid, amount)
SELECT 25, 2, 2100000000
WHERE EXISTS (SELECT 1 FROM products WHERE proid = 25)
  AND EXISTS (SELECT 1 FROM users WHERE id = 2)
  AND NOT EXISTS (SELECT 1 FROM bids WHERE proid = 25 AND userid = 2 AND amount = 2100000000);

INSERT INTO bids (proid, userid, amount)
SELECT 25, 3, 2150000000
WHERE EXISTS (SELECT 1 FROM products WHERE proid = 25)
  AND EXISTS (SELECT 1 FROM users WHERE id = 3)
  AND NOT EXISTS (SELECT 1 FROM bids WHERE proid = 25 AND userid = 3 AND amount = 2150000000);

INSERT INTO bids (proid, userid, amount)
SELECT 13, 2, 2700000
WHERE EXISTS (SELECT 1 FROM products WHERE proid = 13)
  AND EXISTS (SELECT 1 FROM users WHERE id = 2)
  AND NOT EXISTS (SELECT 1 FROM bids WHERE proid = 13 AND userid = 2 AND amount = 2700000);

INSERT INTO bids (proid, userid, amount)
SELECT 16, 4, 3100000
WHERE EXISTS (SELECT 1 FROM products WHERE proid = 16)
  AND EXISTS (SELECT 1 FROM users WHERE id = 4)
  AND NOT EXISTS (SELECT 1 FROM bids WHERE proid = 16 AND userid = 4 AND amount = 3100000);

INSERT INTO bids (proid, userid, amount)
SELECT 6, 5, 185000
WHERE EXISTS (SELECT 1 FROM products WHERE proid = 6)
  AND EXISTS (SELECT 1 FROM users WHERE id = 5)
  AND NOT EXISTS (SELECT 1 FROM bids WHERE proid = 6 AND userid = 5 AND amount = 185000);

-- Update bid_count on products from actual bids
UPDATE products SET bid_count = sub.cnt FROM (
  SELECT proid, COUNT(*) as cnt FROM bids GROUP BY proid
) sub WHERE products.proid = sub.proid;

-- Indexes to speed up queries used by Top-5 endpoints
CREATE INDEX IF NOT EXISTS idx_products_end_time ON products(end_time);
CREATE INDEX IF NOT EXISTS idx_bids_proid ON bids(proid);
CREATE INDEX IF NOT EXISTS idx_products_price_desc ON products(price DESC);

-- Done

