import db from '../utils/db.js';

// Create a new bid
export async function createBid(productId, bidderId, bidAmount) {
  return db('bids')
    .insert({
      proid: productId,
      userid: bidderId,
      amount: bidAmount,
      status: 'active'
    })
    .returning('*');
}

// Get all bids for a product
export async function getBidsByProduct(productId) {
  return db('bids')
    .select('bids.*', 'users.username')
    .leftJoin('users', 'bids.userid', 'users.id')
    .where('bids.proid', productId)
    .orderBy('bids.bid_time', 'desc');
}

// Get user's bid history
export async function getBidsByUser(userId) {
  return db('bids')
    .where('userid', userId)
    .orderBy('bid_time', 'desc');
}

// Mark previous bids as outbid when new bid is placed
export async function markPreviousBidsAsOutbid(productId, excludeBidId) {
  return db('bids')
    .where('proid', productId)
    .where('bidid', '<>', excludeBidId)
    .where('status', 'active')
    .update({ status: 'outbid' });
}

// Get highest bid for a product
export async function getHighestBid(productId) {
  return db('bids')
    .where('proid', productId)
    .orderBy('amount', 'desc')
    .first();
}
