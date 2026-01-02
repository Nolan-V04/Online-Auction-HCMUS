import db from '../utils/db.js';

/**
 * Order Completion Service
 * Handles the 4-step order completion process after auction ends
 */

// Get order completion by product ID
export async function getOrderCompletionByProductId(proid) {
  const result = await db('v_order_completion_details')
    .where('proid', proid)
    .first();
  return result;
}

// Get order completion by ID
export async function getOrderCompletionById(id) {
  const result = await db('v_order_completion_details')
    .where('id', id)
    .first();
  return result;
}

// Create new order completion after auction ends
export async function createOrderCompletion(proid, seller_id, buyer_id, final_price) {
  // Check if order completion already exists
  const existing = await db('order_completion')
    .where('proid', proid)
    .first();
  
  if (existing) {
    return existing;
  }
  
  // Update product status
  await db('products')
    .where('proid', proid)
    .update({
      auction_completed: true,
      final_price: final_price
    });
  
  // Create order completion record
  const [result] = await db('order_completion')
    .insert({
      proid,
      seller_id,
      buyer_id,
      current_step: 1,
      status: 'in_progress'
    })
    .returning('*');
  
  return result;
}

// Step 1: Buyer submits payment proof and shipping address
export async function submitPaymentInfo(order_completion_id, buyer_id, payment_proof, shipping_address) {
  const order = await db('order_completion')
    .where('id', order_completion_id)
    .where('buyer_id', buyer_id)
    .first();
  
  if (!order) {
    throw new Error('Order not found or unauthorized');
  }
  
  if (order.status !== 'in_progress') {
    throw new Error('Order is not in progress');
  }
  
  const [updated] = await db('order_completion')
    .where('id', order_completion_id)
    .update({
      payment_proof,
      shipping_address,
      payment_submitted_at: db.fn.now(),
      current_step: db.raw('GREATEST(current_step, 2)') // Move to step 2 if still at step 1
    })
    .returning('*');
  
  return updated;
}

// Step 2: Seller confirms payment and provides shipping invoice
export async function confirmShipping(order_completion_id, seller_id, shipping_invoice) {
  const order = await db('order_completion')
    .where('id', order_completion_id)
    .where('seller_id', seller_id)
    .first();
  
  if (!order) {
    throw new Error('Order not found or unauthorized');
  }
  
  if (order.status !== 'in_progress') {
    throw new Error('Order is not in progress');
  }
  
  if (!order.payment_submitted_at) {
    throw new Error('Buyer has not submitted payment yet');
  }
  
  const [updated] = await db('order_completion')
    .where('id', order_completion_id)
    .update({
      shipping_invoice,
      shipping_confirmed_at: db.fn.now(),
      current_step: db.raw('GREATEST(current_step, 3)') // Move to step 3
    })
    .returning('*');
  
  return updated;
}

// Step 3: Buyer confirms received goods
export async function confirmReceived(order_completion_id, buyer_id) {
  const order = await db('order_completion')
    .where('id', order_completion_id)
    .where('buyer_id', buyer_id)
    .first();
  
  if (!order) {
    throw new Error('Order not found or unauthorized');
  }
  
  if (order.status !== 'in_progress') {
    throw new Error('Order is not in progress');
  }
  
  if (!order.shipping_confirmed_at) {
    throw new Error('Seller has not confirmed shipping yet');
  }
  
  const [updated] = await db('order_completion')
    .where('id', order_completion_id)
    .update({
      goods_received_at: db.fn.now(),
      current_step: db.raw('GREATEST(current_step, 4)') // Move to step 4
    })
    .returning('*');
  
  return updated;
}

// Step 4: Submit or update rating (buyer or seller)
export async function submitRating(order_completion_id, user_id, rating, comment) {
  const order = await db('order_completion')
    .where('id', order_completion_id)
    .where(function() {
      this.where('buyer_id', user_id).orWhere('seller_id', user_id);
    })
    .first();
  
  if (!order) {
    throw new Error('Order not found or unauthorized');
  }
  
  if (order.status === 'cancelled') {
    throw new Error('Cannot rate cancelled order');
  }
  
  const isBuyer = order.buyer_id === user_id;
  const isSeller = order.seller_id === user_id;
  
  if (!isBuyer && !isSeller) {
    throw new Error('Unauthorized');
  }
  
  // Rating must be 1 (positive) or -1 (negative)
  if (rating !== 1 && rating !== -1) {
    throw new Error('Rating must be 1 (positive) or -1 (negative)');
  }
  
  // Get previous rating if exists
  const prevBuyerRating = order.buyer_rating;
  const prevSellerRating = order.seller_rating;
  
  // Update order completion with new rating
  const updateData = isBuyer ? {
    buyer_rating: rating,
    buyer_rating_comment: comment,
    buyer_rated_at: db.fn.now()
  } : {
    seller_rating: rating,
    seller_rating_comment: comment,
    seller_rated_at: db.fn.now()
  };
  
  // If both have rated, mark as completed
  if (isBuyer && prevSellerRating !== null) {
    updateData.status = 'completed';
  } else if (isSeller && prevBuyerRating !== null) {
    updateData.status = 'completed';
  }
  
  const [updated] = await db('order_completion')
    .where('id', order_completion_id)
    .update(updateData)
    .returning('*');
  
  // Determine who is being rated
  const targetUserId = isBuyer ? order.seller_id : order.buyer_id;
  const reviewerId = user_id;
  
  // Update user rating counts
  if (isBuyer) {
    // Buyer is rating the seller
    await updateUserRating(order.seller_id, rating, prevSellerRating);
    await updateUserRatingReview(targetUserId, reviewerId, order.proid, rating, comment, prevSellerRating);
  } else {
    // Seller is rating the buyer
    await updateUserRating(order.buyer_id, rating, prevBuyerRating);
    await updateUserRatingReview(targetUserId, reviewerId, order.proid, rating, comment, prevBuyerRating);
  }
  
  return updated;
}

// Helper function to update user rating counts
async function updateUserRating(user_id, newRating, prevRating) {
  const user = await db('users').where('id', user_id).first();
  
  let positive = user.positive_ratings || 0;
  let negative = user.negative_ratings || 0;
  let total = user.total_ratings || 0;
  
  // Remove previous rating if exists
  if (prevRating === 1) {
    positive--;
    total--;
  } else if (prevRating === -1) {
    negative--;
    total--;
  }
  
  // Add new rating
  if (newRating === 1) {
    positive++;
    total++;
  } else if (newRating === -1) {
    negative++;
    total++;
  }
  
  await db('users')
    .where('id', user_id)
    .update({
      positive_ratings: positive,
      negative_ratings: negative,
      total_ratings: total
    });
}

// Helper function to update or insert rating in user_rating_reviews table
async function updateUserRatingReview(targetUserId, reviewerId, productId, newRating, comment, prevRating) {
  // Check if rating already exists
  const existingRating = await db('user_rating_reviews')
    .where({
      target_user_id: targetUserId,
      reviewer_id: reviewerId,
      product_id: productId
    })
    .first();
  
  if (existingRating) {
    // Update existing rating
    await db('user_rating_reviews')
      .where('id', existingRating.id)
      .update({
        score: newRating,
        comment: comment || null,
        created_at: db.fn.now() // Update timestamp when rating changes
      });
  } else {
    // Insert new rating
    await db('user_rating_reviews')
      .insert({
        target_user_id: targetUserId,
        reviewer_id: reviewerId,
        product_id: productId,
        score: newRating,
        comment: comment || null
      });
  }
}

// Cancel transaction (seller only, can cancel anytime)
export async function cancelTransaction(order_completion_id, seller_id, reason) {
  const order = await db('order_completion')
    .where('id', order_completion_id)
    .where('seller_id', seller_id)
    .first();
  
  if (!order) {
    throw new Error('Order not found or unauthorized');
  }
  
  if (order.status === 'completed') {
    throw new Error('Cannot cancel completed order');
  }
  
  if (order.status === 'cancelled') {
    throw new Error('Order already cancelled');
  }
  
  // Cancel the order
  const [updated] = await db('order_completion')
    .where('id', order_completion_id)
    .update({
      status: 'cancelled',
      cancelled_by: seller_id,
      cancelled_at: db.fn.now(),
      cancellation_reason: reason,
      // Auto rate buyer -1 when cancelled
      seller_rating: -1,
      seller_rating_comment: reason || 'Transaction cancelled by seller',
      seller_rated_at: db.fn.now()
    })
    .returning('*');
  
  // Update buyer rating with -1
  await updateUserRating(order.buyer_id, -1, order.seller_rating);
  
  // Also save to user_rating_reviews
  await updateUserRatingReview(
    order.buyer_id, 
    seller_id, 
    order.proid, 
    -1, 
    reason || 'Transaction cancelled by seller',
    order.seller_rating
  );
  
  return updated;
}

// Get chat messages for an order
export async function getChatMessages(order_completion_id, user_id) {
  const order = await db('order_completion')
    .where('id', order_completion_id)
    .where(function() {
      this.where('buyer_id', user_id).orWhere('seller_id', user_id);
    })
    .first();
  
  if (!order) {
    throw new Error('Order not found or unauthorized');
  }
  
  const messages = await db('order_chat as oc')
    .join('users as u', 'oc.sender_id', 'u.id')
    .where('oc.order_completion_id', order_completion_id)
    .select(
      'oc.*',
      'u.username as sender_username',
      'u.name as sender_name'
    )
    .orderBy('oc.created_at', 'asc');
  
  // Mark messages as read for current user
  await db('order_chat')
    .where('order_completion_id', order_completion_id)
    .where('sender_id', '!=', user_id)
    .whereNull('read_at')
    .update({ read_at: db.fn.now() });
  
  return messages;
}

// Send chat message
export async function sendChatMessage(order_completion_id, sender_id, message) {
  const order = await db('order_completion')
    .where('id', order_completion_id)
    .where(function() {
      this.where('buyer_id', sender_id).orWhere('seller_id', sender_id);
    })
    .first();
  
  if (!order) {
    throw new Error('Order not found or unauthorized');
  }
  
  const [chatMessage] = await db('order_chat')
    .insert({
      order_completion_id,
      sender_id,
      message
    })
    .returning('*');
  
  return chatMessage;
}

// Get unread message count
export async function getUnreadMessageCount(order_completion_id, user_id) {
  const order = await db('order_completion')
    .where('id', order_completion_id)
    .where(function() {
      this.where('buyer_id', user_id).orWhere('seller_id', user_id);
    })
    .first();
  
  if (!order) {
    return 0;
  }
  
  const result = await db('order_chat')
    .where('order_completion_id', order_completion_id)
    .where('sender_id', '!=', user_id)
    .whereNull('read_at')
    .count('* as count')
    .first();
  
  return parseInt(result.count) || 0;
}

// Check if user can access order completion
export async function canAccessOrderCompletion(proid, user_id) {
  const product = await db('products')
    .where('proid', proid)
    .first();
  
  if (!product) {
    return { canAccess: false, reason: 'Product not found' };
  }
  
  // Check if auction has ended
  if (product.end_time && new Date(product.end_time) > new Date()) {
    return { canAccess: false, reason: 'Auction has not ended yet' };
  }
  
  // Check if there is a winner
  if (!product.highest_bidder) {
    return { canAccess: false, reason: 'No winner for this auction' };
  }
  
  // Check if user is seller or winner
  const isSeller = product.seller_id === user_id;
  const isWinner = product.highest_bidder === user_id;
  
  if (!isSeller && !isWinner) {
    return { canAccess: false, reason: 'User is not seller or winner' };
  }
  
  return { 
    canAccess: true, 
    isSeller,
    isWinner,
    product 
  };
}

export default {
  getOrderCompletionByProductId,
  getOrderCompletionById,
  createOrderCompletion,
  submitPaymentInfo,
  confirmShipping,
  confirmReceived,
  submitRating,
  cancelTransaction,
  getChatMessages,
  sendChatMessage,
  getUnreadMessageCount,
  canAccessOrderCompletion
};
