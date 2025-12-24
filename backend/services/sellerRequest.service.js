import db from '../utils/db.js';

export function listRequests() {
  return db('seller_upgrade_requests')
    .select('seller_upgrade_requests.*', 'users.name', 'users.email')
    .leftJoin('users', 'seller_upgrade_requests.user_id', 'users.id')
    .orderBy('seller_upgrade_requests.id', 'asc');
}

export function getLatestByUser(userId) {
  return db('seller_upgrade_requests')
    .where('user_id', userId)
    .orderBy('created_at', 'desc')
    .first();
}

export async function createRequest(userId, requestedDays = 7) {
  // Ensure no pending request
  const pending = await db('seller_upgrade_requests')
    .where({ user_id: userId, status: 'pending' })
    .first();
  if (pending) return { error: 'Bạn đã có yêu cầu đang chờ duyệt' };

  const rows = await db('seller_upgrade_requests')
    .insert({ user_id: userId, requested_days: requestedDays })
    .returning('*');
  return rows?.[0];
}

// Admin approves: update status and set expires_at; also update user role
export async function approveRequest(requestId, adminId, days = 7) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const updated = await db('seller_upgrade_requests')
    .where('id', requestId)
    .update({
      status: 'approved',
      decided_at: now,
      admin_id: adminId || null,
      expires_at: expiresAt
    })
    .returning('*');

  const req = updated?.[0];
  if (req) {
    await db('users').where('id', req.user_id).update({ role_id: 2 });
  }
  return req;
}

export async function rejectRequest(requestId, adminId, note) {
  const updated = await db('seller_upgrade_requests')
    .where('id', requestId)
    .update({
      status: 'rejected',
      decided_at: new Date(),
      admin_id: adminId || null,
      note: note || null
    })
    .returning('*');
  return updated?.[0];
}
