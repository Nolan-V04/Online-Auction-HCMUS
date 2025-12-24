import db from '../utils/db.js';

export function addRating({ targetUserId, reviewerId, productId, score, comment }) {
  return db('user_rating_reviews')
    .insert({
      target_user_id: targetUserId,
      reviewer_id: reviewerId,
      product_id: productId || null,
      score,
      comment: comment || null
    })
    .returning('*');
}

export function getRatingsForUser(targetUserId) {
  return db('user_rating_reviews as r')
    .leftJoin('users as u', 'r.reviewer_id', 'u.id')
    .leftJoin('products as p', 'r.product_id', 'p.proid')
    .select(
      'r.id',
      'r.score',
      'r.comment',
      'r.created_at',
      'r.reviewer_id',
      'u.username as reviewer_username',
      'u.name as reviewer_name',
      'p.proid',
      'p.proname'
    )
    .where('r.target_user_id', targetUserId)
    .orderBy('r.created_at', 'desc');
}

export async function getRatingSummary(targetUserId) {
  const row = await db('user_rating_reviews')
    .where('target_user_id', targetUserId)
    .select(
      db.raw("SUM(CASE WHEN score = 1 THEN 1 ELSE 0 END) AS positive"),
      db.raw("SUM(CASE WHEN score = -1 THEN 1 ELSE 0 END) AS negative"),
      db.raw("COUNT(*) AS total")
    )
    .first();

  return {
    positive: Number(row?.positive || 0),
    negative: Number(row?.negative || 0),
    total: Number(row?.total || 0)
  };
}
