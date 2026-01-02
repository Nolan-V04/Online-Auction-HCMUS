import express from 'express';
import * as orderCompletionService from '../services/orderCompletion.service.js';

const router = express.Router();

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      result_code: -1,
      result_message: 'Vui lòng đăng nhập'
    });
  }
  next();
}

// Get order completion by product ID
router.get('/product/:proid', requireAuth, async (req, res) => {
  try {
    const { proid } = req.params;
    const user_id = req.user.id;
    
    // Check if user can access this order completion
    const access = await orderCompletionService.canAccessOrderCompletion(proid, user_id);
    if (!access.canAccess) {
      return res.status(403).json({
        result_code: -1,
        result_message: access.reason
      });
    }
    
    // Get or create order completion
    let orderCompletion = await orderCompletionService.getOrderCompletionByProductId(proid);
    
    // Create new order completion if it doesn't exist yet (auction has ended and has winner)
    if (!orderCompletion && access.product.highest_bidder) {
      orderCompletion = await orderCompletionService.createOrderCompletion(
        proid,
        access.product.seller_id,
        access.product.highest_bidder,
        access.product.price
      );
      // Fetch full details after creation
      orderCompletion = await orderCompletionService.getOrderCompletionByProductId(proid);
    }
    
    // Get unread message count
    let unreadCount = 0;
    if (orderCompletion) {
      unreadCount = await orderCompletionService.getUnreadMessageCount(orderCompletion.id, user_id);
    }
    
    res.json({
      result_code: 0,
      order_completion: orderCompletion,
      unread_count: unreadCount,
      is_seller: access.isSeller,
      is_winner: access.isWinner
    });
  } catch (error) {
    console.error('Get order completion error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: error.message
    });
  }
});

// Step 1: Buyer submits payment info
router.post('/:id/payment', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_proof, shipping_address } = req.body;
    const buyer_id = req.user.id;
    
    if (!payment_proof || !shipping_address) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Payment proof and shipping address are required'
      });
    }
    
    const updated = await orderCompletionService.submitPaymentInfo(
      id,
      buyer_id,
      payment_proof,
      shipping_address
    );
    
    res.json({
      result_code: 0,
      order_completion: updated
    });
  } catch (error) {
    console.error('Submit payment error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: error.message
    });
  }
});

// Step 2: Seller confirms shipping
router.post('/:id/shipping', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { shipping_invoice } = req.body;
    const seller_id = req.user.id;
    
    if (!shipping_invoice) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Shipping invoice is required'
      });
    }
    
    const updated = await orderCompletionService.confirmShipping(
      id,
      seller_id,
      shipping_invoice
    );
    
    res.json({
      result_code: 0,
      order_completion: updated
    });
  } catch (error) {
    console.error('Confirm shipping error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: error.message
    });
  }
});

// Step 3: Buyer confirms received
router.post('/:id/received', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const buyer_id = req.user.id;
    
    const updated = await orderCompletionService.confirmReceived(id, buyer_id);
    
    res.json({
      result_code: 0,
      order_completion: updated
    });
  } catch (error) {
    console.error('Confirm received error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: error.message
    });
  }
});

// Step 4: Submit or update rating
router.post('/:id/rating', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user.id;
    
    if (!rating || (rating !== 1 && rating !== -1)) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Rating must be 1 (positive) or -1 (negative)'
      });
    }
    
    const updated = await orderCompletionService.submitRating(
      id,
      user_id,
      rating,
      comment
    );
    
    res.json({
      result_code: 0,
      order_completion: updated
    });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: error.message
    });
  }
});

// Cancel transaction (seller only)
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const seller_id = req.user.id;
    
    const updated = await orderCompletionService.cancelTransaction(
      id,
      seller_id,
      reason
    );
    
    res.json({
      result_code: 0,
      order_completion: updated
    });
  } catch (error) {
    console.error('Cancel transaction error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: error.message
    });
  }
});

// Get chat messages
router.get('/:id/chat', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    const messages = await orderCompletionService.getChatMessages(id, user_id);
    
    res.json({
      result_code: 0,
      messages
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: error.message
    });
  }
});

// Send chat message
router.post('/:id/chat', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const sender_id = req.user.id;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Message is required'
      });
    }
    
    const chatMessage = await orderCompletionService.sendChatMessage(
      id,
      sender_id,
      message.trim()
    );
    
    res.json({
      result_code: 0,
      message: chatMessage
    });
  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: error.message
    });
  }
});

export default router;
