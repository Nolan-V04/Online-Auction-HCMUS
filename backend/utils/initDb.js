import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.resolve(__dirname, '../db');

function readSql(fileName) {
  const full = path.join(dbDir, fileName);
  return fs.readFileSync(full, 'utf-8');
}

export async function initDb() {
  try {
    const files = [
      'add_user_rating_reviews.sql',
      'add_seller_upgrade_requests.sql',
      'add_products_removed.sql'
    ];
    for (const f of files) {
      const fullPath = path.join(dbDir, f);
      if (!fs.existsSync(fullPath)) {
        console.warn(`[DB] Skip missing file: ${fullPath}`);
        continue;
      }
      const sql = readSql(f);
      await db.raw(sql);
      console.log(`[DB] Executed: ${f}`);
    }
    console.log('[DB] Initialization scripts executed');
  } catch (err) {
    console.error('[DB] Initialization failed:', err);
    throw err;
  }
}
