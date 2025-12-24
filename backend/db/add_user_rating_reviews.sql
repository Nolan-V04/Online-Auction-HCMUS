-- Migration: add table for user rating reviews with comments
-- Creates user_rating_reviews to store reviewer comments and score per target user

CREATE TABLE IF NOT EXISTS user_rating_reviews (
  id SERIAL PRIMARY KEY,
  target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  product_id INTEGER REFERENCES products(proid) ON DELETE SET NULL,
  score SMALLINT NOT NULL CHECK (score IN (-1, 1)), -- 1 = positive, -1 = negative
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_rating_reviews_target ON user_rating_reviews(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_rating_reviews_reviewer ON user_rating_reviews(reviewer_id);
