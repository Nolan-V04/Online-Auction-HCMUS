import db from '../utils/db.js';

export function add(user) {
  return db('users')
    .insert(user)
    .returning(['id']);
}

export function findByUsername(username) {
  return db('users').where('username', username).first();
}

export function findByEmail(email) {
  return db('users').where('email', email).first();
}

export function findById(id) {
  return db('users').where('id', id).first();
}

export function update(id, user) {
  return db('users').where('id', id).update(user).returning(['id']);
}

// Watchlist operations
export async function getWatchlist(userId) {
  const user = await db('users').where('id', userId).select('watchlist').first();
  return user?.watchlist || [];
}

export async function addToWatchlist(userId, productId) {
  // Use PostgreSQL array_append and check if not already exists
  return db.raw(`
    UPDATE users 
    SET watchlist = array_append(watchlist, ?)
    WHERE id = ? AND NOT (? = ANY(watchlist))
    RETURNING watchlist
  `, [productId, userId, productId]);
}

export async function removeFromWatchlist(userId, productId) {
  return db.raw(`
    UPDATE users 
    SET watchlist = array_remove(watchlist, ?)
    WHERE id = ?
    RETURNING watchlist
  `, [productId, userId]);
}

export async function isInWatchlist(userId, productId) {
  const result = await db.raw(`
    SELECT EXISTS(
      SELECT 1 FROM users 
      WHERE id = ? AND ? = ANY(watchlist)
    ) as exists
  `, [userId, productId]);
  return result.rows[0]?.exists || false;
}

export function findAll() {
  return db('users').select('*');
}

export async function del(id) {
  // Check if user has any bids
  const bidsCount = await db('bids').where('userid', id).count('* as count').first();
  if (bidsCount && parseInt(bidsCount.count) > 0) {
    throw new Error('Không thể xóa người dùng đã có lịch sử đấu giá');
  }
  return db('users').where('id', id).del();
}