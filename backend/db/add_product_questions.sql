-- Create product_questions table for Q&A feature
CREATE TABLE IF NOT EXISTS product_questions (
  qid SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(proid) ON DELETE CASCADE,
  asker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asker_name VARCHAR(100) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  asked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  answered_at TIMESTAMP,
  answered_by INTEGER REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_questions_product_id ON product_questions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_questions_asker_id ON product_questions(asker_id);
CREATE INDEX IF NOT EXISTS idx_product_questions_asked_at ON product_questions(asked_at DESC);
