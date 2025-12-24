-- Migration: seller upgrade requests (temporary seller access for 7 days upon approval)

CREATE TABLE IF NOT EXISTS seller_upgrade_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  requested_days SMALLINT NOT NULL DEFAULT 7, -- default 7 days
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  expires_at TIMESTAMPTZ
);

-- Only one pending request per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_upgrade_pending_unique ON seller_upgrade_requests(user_id) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_seller_upgrade_user ON seller_upgrade_requests(user_id);
