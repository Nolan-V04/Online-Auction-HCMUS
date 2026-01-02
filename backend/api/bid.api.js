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

  console.log('Checking approved permission:', {
    product_id: product.proid,
    bidder_id: user.id,
    approvedPermission: approvedPermission
  });

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

    // Check if bid amount reaches buy_now_price
    const buyNowPrice = parseFloat(product.buy_now_price) || 0;
    const isBuyNow = buyNowPrice > 0 && parseFloat(bidAmount) >= buyNowPrice;

    // Create the bid
    const [newBid] = await bidService.createBid(productId, bidderId, bidAmount);

    // If bid reaches buy_now_price, end auction immediately
    if (isBuyNow) {
      await productService.patch(productId, {
        price: bidAmount,
        bid_count: (product.bid_count || 0) + 1,
        highest_bidder: bidderId,
        end_time: new Date() // End auction immediately
      });

      // Mark previous bids as outbid
      await bidService.markPreviousBidsAsOutbid(productId, newBid.bidid);

      return res.json({
        result_code: 0,
        result_message: 'Đấu giá thành công! Bạn đã thắng với giá mua ngay.',
        bid: newBid,
        new_price: bidAmount,
        auction_ended: true,
        is_winner: true
      });
    }

    // Update product price and bid count (normal bid)
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

// Buy now - immediately purchase the product at buy_now_price
router.post('/buy-now', requireAuth, async (req, res) => {
  try {
    const { productId } = req.body;
    const buyerId = req.user.id;

    if (!productId) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Thiếu thông tin sản phẩm'
      });
    }

    const db = (await import('../utils/db.js')).default;
    
    // Get product details
    const product = await db('products').where({ proid: productId }).first();

    if (!product) {
      return res.status(404).json({
        result_code: -1,
        result_message: 'Không tìm thấy sản phẩm'
      });
    }

    // Check if product has buy_now_price
    if (!product.buy_now_price) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Sản phẩm này không có giá mua ngay'
      });
    }

    // Check if product is still active
    if (product.end_time && new Date(product.end_time) < new Date()) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Sản phẩm đã kết thúc'
      });
    }

    // Get user details for eligibility check
    const buyer = await db('users').where({ id: buyerId }).first();

    // Check eligibility
    const eligibility = await isEligibleToBid(buyer, product, db);
    if (!eligibility.eligible) {
      return res.status(403).json({
        result_code: -1,
        result_message: eligibility.reason
      });
    }

    // End the auction immediately and set the buyer as winner
    await db('products')
      .where({ proid: productId })
      .update({
        end_time: new Date(),
        price: product.buy_now_price,
        highest_bidder: buyerId
      });

    // Record the buy now as a bid in history
    await db('bids').insert({
      proid: productId,
      userid: buyerId,
      amount: product.buy_now_price,
      bid_time: new Date()
    });

    res.json({
      result_code: 0,
      result_message: 'Mua ngay thành công!',
      final_price: product.buy_now_price
    });

  } catch (error) {
    console.error('Buy now error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi mua sản phẩm'
    });
  }
});

// Get user's bidding history (products they have bid on)
router.get('/my-bids', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[MY-BIDS] User ID:', userId, 'Username:', req.user.username);
    const db = (await import('../utils/db.js')).default;

    // Only get products where auction is still active (end_time in future)
    const myBids = await db('bids')
      .join('products', 'bids.proid', 'products.proid')
      .leftJoin('users as seller', 'products.seller_id', 'seller.id')
      .where('bids.userid', userId)
      .where('products.end_time', '>', new Date()) // Only active auctions
      .select(
        'products.proid',
        'products.proname',
        'products.price',
        'products.end_time',
        'products.highest_bidder',
        'products.seller_id',
        'products.images',
        'seller.username as seller_name',
        'seller.email as seller_email',
        db.raw('MAX(bids.amount) as my_highest_bid'),
        db.raw('COUNT(bids.bidid) as my_bid_count')
      )
      .groupBy(
        'products.proid',
        'products.proname',
        'products.price',
        'products.end_time',
        'products.highest_bidder',
        'products.seller_id',
        'products.images',
        'seller.username',
        'seller.email'
      )
      .orderBy('products.end_time', 'asc'); // Show ending soon first

    console.log('[MY-BIDS] Found', myBids.length, 'products for user', userId);
    res.json({
      result_code: 0,
      products: myBids
    });

  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi lấy danh sách đấu giá'
    });
  }
});

// Get user's won products (products where they are the highest bidder and auction ended)
router.get('/my-wins', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[MY-WINS] User ID:', userId, 'Username:', req.user.username);
    const db = (await import('../utils/db.js')).default;

    const myWins = await db('products')
      .leftJoin('users as seller', 'products.seller_id', 'seller.id')
      .leftJoin('user_rating_reviews', function() {
        this.on('user_rating_reviews.product_id', '=', 'products.proid')
            .andOn('user_rating_reviews.reviewer_id', '=', db.raw('?', [userId]));
      })
      .where('products.highest_bidder', userId)
      .where('products.end_time', '<', new Date())
      .select(
        'products.proid',
        'products.proname',
        'products.price',
        'products.end_time',
        'products.seller_id',
        'products.images',
        'seller.username as seller_name',
        'seller.email as seller_email',
        'seller.positive_ratings as seller_positive_ratings',
        'seller.negative_ratings as seller_negative_ratings',
        'seller.total_ratings as seller_total_ratings',
        'user_rating_reviews.score as my_rating',
        'user_rating_reviews.comment as my_comment'
      )
      .orderBy('products.end_time', 'desc');

    console.log('[MY-WINS] Found', myWins.length, 'products for user', userId);
    res.json({
      result_code: 0,
      products: myWins
    });

  } catch (error) {
    console.error('Get my wins error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi lấy danh sách sản phẩm đã thắng'
    });
  }
});

// Rate a seller for a won product
router.post('/rate-seller', requireAuth, async (req, res) => {
  try {
    const { productId, score, comment } = req.body;
    const reviewerId = req.user.id;

    if (!productId || (score !== 1 && score !== -1)) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Thiếu thông tin hoặc điểm đánh giá không hợp lệ'
      });
    }

    const db = (await import('../utils/db.js')).default;

    // Get product details
    const product = await db('products').where({ proid: productId }).first();

    if (!product) {
      return res.status(404).json({
        result_code: -1,
        result_message: 'Không tìm thấy sản phẩm'
      });
    }

    // Check if user is the winner
    if (product.highest_bidder !== reviewerId) {
      return res.status(403).json({
        result_code: -1,
        result_message: 'Bạn không phải là người thắng đấu giá'
      });
    }

    // Check if auction has ended
    if (!product.end_time || new Date(product.end_time) > new Date()) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Đấu giá chưa kết thúc'
      });
    }

    // Check if already rated
    const existingRating = await db('user_rating_reviews')
      .where({
        product_id: productId,
        reviewer_id: reviewerId
      })
      .first();

    if (existingRating) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Bạn đã đánh giá người bán này rồi'
      });
    }

    // Insert rating
    await db('user_rating_reviews').insert({
      product_id: productId,
      reviewer_id: reviewerId,
      target_user_id: product.seller_id,
      score: score,
      comment: comment || null,
      created_at: new Date()
    });

    // Update seller ratings
    const seller = await db('users').where({ id: product.seller_id }).first();
    const newPositive = (seller.positive_ratings || 0) + (score === 1 ? 1 : 0);
    const newNegative = (seller.negative_ratings || 0) + (score === -1 ? 1 : 0);
    const newTotal = (seller.total_ratings || 0) + 1;

    await db('users')
      .where({ id: product.seller_id })
      .update({
        positive_ratings: newPositive,
        negative_ratings: newNegative,
        total_ratings: newTotal
      });

    res.json({
      result_code: 0,
      result_message: 'Đánh giá thành công'
    });

  } catch (error) {
    console.error('Rate seller error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi đánh giá người bán'
    });
  }
});

export default router;
