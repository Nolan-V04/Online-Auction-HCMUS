import express from 'express';
import * as bidService from '../services/bid.service.js';
import * as productService from '../services/product.service.js';
import * as userService from '../services/user.service.js';

const router = express.Router();

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      result_code: -1,
      result_message: 'Vui lòng đăng nhập để đấu giá'
    });
  }
  next();
}

// Calculate bidder rating percentage
function calculateRatingPercentage(user) {
  const totalRatings = user.total_ratings || 0;
  if (totalRatings === 0) return null; // No rating history
  
  const positiveRatings = user.positive_ratings || 0;
  return (positiveRatings / totalRatings) * 100;
}

// Check if bidder is eligible to bid
async function isEligibleToBid(user, product, db) {
  // FIRST: Check if user is the seller - sellers cannot bid on their own products
  if (product.seller_id && user.id === product.seller_id) {
    return {
      eligible: false,
      reason: 'Người bán không thể đấu giá sản phẩm của chính mình'
    };
  }

  // SECOND: Check if user has been rejected by seller
  const isRejected = await db('rejected_bidders')
    .where({
      product_id: product.proid,
      bidder_id: user.id
    })
    .first();

  if (isRejected) {
    return {
      eligible: false,
      reason: 'Bạn đã bị người bán từ chối đấu giá sản phẩm này'
    };
  }

  const ratingPercentage = calculateRatingPercentage(user);
  
  // Check if user has approved permission for this product
  const approvedPermission = await db('bid_permission_requests')
    .where({
      product_id: product.proid,
      bidder_id: user.id,
      status: 'approved'
    })
    .first();

  // If user has approved permission, they can bid
  if (approvedPermission) {
    return {
      eligible: true,
      reason: 'Đã được người bán chấp nhận'
    };
  }

  // If user has no rating history
  if (ratingPercentage === null) {
    return {
      eligible: product.allow_unrated_bidders === true,
      reason: product.allow_unrated_bidders 
        ? 'Được phép đấu giá (chưa có đánh giá)' 
        : 'Người bán không cho phép bidder chưa được đánh giá tham gia'
    };
  }
  
  // If user has rating history, check if >= 80%
  if (ratingPercentage >= 80) {
    return {
      eligible: true,
      reason: `Đủ điều kiện (${ratingPercentage.toFixed(1)}% đánh giá tích cực)`
    };
  }
  
  return {
    eligible: false,
    reason: `Không đủ điều kiện (${ratingPercentage.toFixed(1)}% < 80% yêu cầu)`
  };
}

// Place a bid
router.post('/place', requireAuth, async (req, res) => {
  try {
    const { productId, bidAmount } = req.body;
    const bidderId = req.user.id;

    if (!productId || !bidAmount) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Thiếu thông tin sản phẩm hoặc giá đấu'
      });
    }

    // Get product details
    const product = await productService.findById(productId);
    if (!product) {
      return res.status(404).json({
        result_code: -1,
        result_message: 'Sản phẩm không tồn tại'
      });
    }

    // Check if auction has ended
    if (product.end_time && new Date(product.end_time) < new Date()) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Phiên đấu giá đã kết thúc'
      });
    }

    // Get bidder info
    const bidder = await userService.findById(bidderId);
    
    // Get database connection
    const db = req.app.get('db');
    
    // Check eligibility
    const eligibility = await isEligibleToBid(bidder, product, db);
    if (!eligibility.eligible) {
      return res.status(403).json({
        result_code: -1,
        result_message: eligibility.reason,
        rating_info: {
          positive: bidder.positive_ratings || 0,
          negative: bidder.negative_ratings || 0,
          total: bidder.total_ratings || 0,
          percentage: calculateRatingPercentage(bidder)
        }
      });
    }

    // Calculate minimum required bid
    const currentPrice = parseFloat(product.price) || 0;
    const bidStep = parseFloat(product.bid_step) || 10000;
    const minRequiredBid = currentPrice + bidStep;

    // Validate bid amount
    if (parseFloat(bidAmount) < minRequiredBid) {
      return res.status(400).json({
        result_code: -1,
        result_message: `Giá đấu phải ít nhất ${new Intl.NumberFormat('vi-VN').format(minRequiredBid)} ₫`,
        min_required: minRequiredBid,
        current_price: currentPrice,
        bid_step: bidStep
      });
    }

    // Create the bid
    const [newBid] = await bidService.createBid(productId, bidderId, bidAmount);

    // Update product price and bid count
    await productService.patch(productId, {
      price: bidAmount,
      bid_count: (product.bid_count || 0) + 1,
      highest_bidder: bidderId  // Use user ID, not username
    });

    // Mark previous bids as outbid
    await bidService.markPreviousBidsAsOutbid(productId, newBid.bidid);

    res.json({
      result_code: 0,
      result_message: 'Đặt giá thành công',
      bid: newBid,
      new_price: bidAmount
    });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi đặt giá'
    });
  }
});

// Get bid information for a product (for UI display)
router.get('/info/:productId', requireAuth, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const bidderId = req.user.id;

    if (isNaN(productId)) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Product ID không hợp lệ'
      });
    }

    // Get product details
    const product = await productService.findById(productId);
    if (!product) {
      return res.status(404).json({
        result_code: -1,
        result_message: 'Sản phẩm không tồn tại'
      });
    }

    // Get bidder info
    const bidder = await userService.findById(bidderId);
    
    // Get database connection
    const db = req.app.get('db');
    
    // Check eligibility
    const eligibility = await isEligibleToBid(bidder, product, db);
    
    // Calculate suggested bid
    const currentPrice = parseFloat(product.price) || 0;
    const bidStep = parseFloat(product.bid_step) || 10000;
    const suggestedBid = currentPrice + bidStep;

    res.json({
      result_code: 0,
      result_message: 'Success',
      eligible: eligibility.eligible,
      reason: eligibility.reason,
      current_price: currentPrice,
      bid_step: bidStep,
      suggested_bid: suggestedBid,
      rating_info: {
        positive: bidder.positive_ratings || 0,
        negative: bidder.negative_ratings || 0,
        total: bidder.total_ratings || 0,
        percentage: calculateRatingPercentage(bidder)
      },
      product_info: {
        name: product.proname,
        end_time: product.end_time,
        bid_count: product.bid_count || 0
      }
    });
  } catch (error) {
    console.error('Get bid info error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi lấy thông tin đấu giá'
    });
  }
});

// Get bid history for a product
router.get('/history/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    if (isNaN(productId)) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Product ID không hợp lệ'
      });
    }

    const bids = await bidService.getBidsByProduct(productId);

    res.json({
      result_code: 0,
      result_message: 'Success',
      bids
    });
  } catch (error) {
    console.error('Get bid history error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi lấy lịch sử đấu giá'
    });
  }
});

export default router;
