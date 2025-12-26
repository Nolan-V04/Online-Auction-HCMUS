import express from 'express';
import * as productService from '../services/product.service.js';
const router = express.Router();

// Top 5 ending soon
router.get('/top-ending', async (req, res) => {
  try {
    const rows = await productService.findTopEnding(5);
    res.json({ result_code: 0, result_message: 'Success', products: rows });
  } catch (err) {
    console.error('/api/products/top-ending error', err);
    res.status(500).json({ result_code: -1, result_message: err.message, debug: process.env.NODE_ENV !== 'production' ? err.stack : undefined });
  }
});

// Top 5 most bids
router.get('/top-bids', async (req, res) => {
  try {
    const rows = await productService.findTopByBids(5);
    res.json({ result_code: 0, result_message: 'Success', products: rows });
  } catch (err) {
    console.error('/api/products/top-bids error', err);
    res.status(500).json({ result_code: -1, result_message: err.message, debug: process.env.NODE_ENV !== 'production' ? err.stack : undefined });
  }
});

// Top 5 highest price
router.get('/top-price', async (req, res) => {
  try {
    const rows = await productService.findTopByPrice(5);
    res.json({ result_code: 0, result_message: 'Success', products: rows });
  } catch (err) {
    console.error('/api/products/top-price error', err);
    res.status(500).json({ result_code: -1, result_message: err.message, debug: process.env.NODE_ENV !== 'production' ? err.stack : undefined });
  }
});

// General list endpoint (optional catid, pagination)
// GET /api/products?catid=1&page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const { catid, page = 1, limit = 20 } = req.query;
    if (catid) {
      const p = Math.max(1, parseInt(page) || 1);
      const l = Math.max(1, Math.min(100, parseInt(limit) || 20));
      const offset = (p - 1) * l;
      
      // Check if this category has children (is a parent category)
      const db = req.app.get('db');
      const children = await db('categories').where('parent_id', catid).select('catid');
      
      let rows, countRow;
      
      if (children.length > 0) {
        // Parent category: get products from all child categories
        const categoryIds = [parseInt(catid), ...children.map(c => c.catid)];
        rows = await productService.findPageByMultipleCats(categoryIds, l, offset);
        countRow = await productService.countByMultipleCats(categoryIds);
      } else {
        // Leaf category: get products directly
        rows = await productService.findPageByCat(catid, l, offset);
        countRow = await productService.countByCat(catid);
      }
      
      res.json({ result_code: 0, result_message: 'Success', products: rows, total: parseInt(countRow?.count || 0, 10) });
    } else {
      const rows = await productService.findAll();
      res.json({ result_code: 0, result_message: 'Success', products: rows });
    }
  } catch (err) {
    console.error('/api/products list error', err);
    res.status(500).json({ result_code: -1, result_message: err.message, debug: process.env.NODE_ENV !== 'production' ? err.stack : undefined });
  }
});

router.get('/detail/:proid', async (req, res) => {
  try {
    const id = req.params.proid;
    const db = req.app.get('db');
    
    const product = await productService.findByIdWithHighestBidder(id);
    if (product) {
      // Get questions for this product
      const questions = await db('product_questions')
        .where('product_id', id)
        .orderBy('asked_at', 'desc')
        .select('*');
      
      // Add questions to product object
      product.qa_list = questions;
      
      res.json({ result_code: 0, result_message: 'Success', product: product });
    } else {
      res.status(404).json({ result_code: -1, result_message: 'Product not found' });
    }
  } catch (err) {
    console.error('/api/products/detail/:proid error', err);
    res.status(500).json({ result_code: -1, result_message: err.message, debug: process.env.NODE_ENV !== 'production' ? err.stack : undefined });
  }
});

router.get('/related/:proid', async (req, res) => {
  try {
    const id = req.params.proid;
    const related = await productService.findRelated(id, 5);
    if (related) {
      res.json({ result_code: 0, result_message: 'Success', products: related });
    } else {
      res.status(404).json({ result_code: -1, result_message: 'Product not found' });
    }
  } catch (err) {
    console.error('/api/products/related/:proid error', err);
    res.status(500).json({ result_code: -1, result_message: err.message, debug: process.env.NODE_ENV !== 'production' ? err.stack : undefined });
  }
});

// Count products by category
router.get('/count-by-category/:catid', async (req, res) => {
  try {
    const catid = parseInt(req.params.catid);
    
    // Check if this category has children (is a parent category)
    const db = req.app.get('db');
    const children = await db('categories').where('parent_id', catid).select('catid');
    
    let totalCount = 0;
    
    if (children.length > 0) {
      // Parent category: count products from all child categories
      const childIds = children.map(c => c.catid);
      const countRow = await db('products')
        .whereIn('catid', childIds)
        .count('proid as count')
        .first();
      totalCount = parseInt(countRow?.count || 0, 10);
    } else {
      // Child category or standalone: count its own products
      const countRow = await productService.countByCat(catid);
      totalCount = parseInt(countRow?.count || 0, 10);
    }
    
    res.json({ result_code: 0, result_message: 'Success', count: totalCount });
  } catch (err) {
    console.error('/api/products/count-by-category/:catid error', err);
    res.status(500).json({ result_code: -1, result_message: err.message });
  }
});

// Append description to product (seller only)
router.patch('/:proid/append-description', async (req, res) => {
  try {
    const proid = parseInt(req.params.proid);
    const { additionalDescription } = req.body;

    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        result_code: -1,
        result_message: 'Vui lòng đăng nhập'
      });
    }

    // Get product
    const product = await productService.findById(proid);
    if (!product) {
      return res.status(404).json({
        result_code: -1,
        result_message: 'Không tìm thấy sản phẩm'
      });
    }

    // Check if user is the seller
    if (product.seller_id !== req.user.id) {
      return res.status(403).json({
        result_code: -1,
        result_message: 'Bạn không có quyền chỉnh sửa sản phẩm này'
      });
    }

    // Create timestamp for the update
    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Append new description with timestamp
    const timestampHeader = `<hr><p><em><strong>Cập nhật ngày ${dateStr}</strong></em></p>`;
    const updatedFulldes = (product.fulldes || '') + '\n\n' + timestampHeader + '\n' + (additionalDescription || '');
    
    await productService.patch(proid, {
      fulldes: updatedFulldes
    });

    res.json({
      result_code: 0,
      result_message: 'Đã cập nhật mô tả thành công'
    });
  } catch (err) {
    console.error('/api/products/:proid/append-description error', err);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi cập nhật mô tả'
    });
  }
});

// Reject a bidder from a product (seller only)
router.post('/:proid/reject-bidder', async (req, res) => {
  try {
    const proid = parseInt(req.params.proid);
    const { bidderId } = req.body;

    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        result_code: -1,
        result_message: 'Vui lòng đăng nhập'
      });
    }

    // Get product
    const product = await productService.findById(proid);
    if (!product) {
      return res.status(404).json({
        result_code: -1,
        result_message: 'Không tìm thấy sản phẩm'
      });
    }

    // Check if user is the seller
    if (product.seller_id !== req.user.id) {
      return res.status(403).json({
        result_code: -1,
        result_message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    const db = req.app.get('db');

    // Add to rejected bidders list
    await db('rejected_bidders').insert({
      product_id: proid,
      bidder_id: bidderId,
      rejected_by: req.user.id
    }).onConflict(['product_id', 'bidder_id']).ignore();

    // If rejected bidder is the highest bidder, find the second highest bid
    if (product.highest_bidder === bidderId) {
      // Get the second highest valid bid (not from rejected bidder)
      const secondHighestBid = await db('bids')
        .where('proid', proid)
        .whereNot('userid', bidderId)
        .whereNotIn('userid', function() {
          this.select('bidder_id')
            .from('rejected_bidders')
            .where('product_id', proid);
        })
        .orderBy('amount', 'desc')
        .first();

      if (secondHighestBid) {
        // Update product with second highest bidder
        await productService.patch(proid, {
          price: secondHighestBid.amount,
          highest_bidder: secondHighestBid.userid
        });
      } else {
        // No other bidders, reset to starting price
        await productService.patch(proid, {
          price: product.starting_price || product.price,
          highest_bidder: null,
          bid_count: 0
        });
      }
    }

    res.json({
      result_code: 0,
      result_message: 'Đã từ chối người mua thành công'
    });
  } catch (err) {
    console.error('/api/products/:proid/reject-bidder error', err);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi từ chối người mua'
    });
  }
});

// Submit a question about a product
router.post('/:proid/questions', async (req, res) => {
  try {
    const proid = parseInt(req.params.proid);
    const { question } = req.body;

    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        result_code: -1,
        result_message: 'Vui lòng đăng nhập để đặt câu hỏi'
      });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Vui lòng nhập câu hỏi'
      });
    }

    // Get product and seller info
    const product = await productService.findByIdWithHighestBidder(proid);
    if (!product) {
      return res.status(404).json({
        result_code: -1,
        result_message: 'Không tìm thấy sản phẩm'
      });
    }

    const db = req.app.get('db');

    // Insert question into database
    await db('product_questions').insert({
      product_id: proid,
      asker_id: req.user.id,
      asker_name: req.user.username || req.user.email,
      question: question.trim()
    });

    // Send email notification to seller
    if (product.seller_email) {
      const { sendQuestionNotificationEmail } = await import('../utils/email.js');
      await sendQuestionNotificationEmail(
        product.seller_email,
        product.seller_name || 'Người bán',
        product.proname,
        proid,
        req.user.username || req.user.email,
        question.trim()
      );
    }

    res.json({
      result_code: 0,
      result_message: 'Đã gửi câu hỏi thành công'
    });
  } catch (err) {
    console.error('/api/products/:proid/questions error', err);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi gửi câu hỏi'
    });
  }
});

// Get questions for a product
router.get('/:proid/questions', async (req, res) => {
  try {
    const proid = parseInt(req.params.proid);
    const db = req.app.get('db');

    const questions = await db('product_questions')
      .where('product_id', proid)
      .orderBy('asked_at', 'desc')
      .select('*');

    res.json({
      result_code: 0,
      questions: questions
    });
  } catch (err) {
    console.error('/api/products/:proid/questions GET error', err);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi lấy danh sách câu hỏi'
    });
  }
});

// Answer a question (seller only)
router.patch('/:proid/questions/:qid/answer', async (req, res) => {
  try {
    const proid = parseInt(req.params.proid);
    const qid = parseInt(req.params.qid);
    const { answer } = req.body;

    if (!req.user) {
      return res.status(401).json({
        result_code: -1,
        result_message: 'Vui lòng đăng nhập'
      });
    }

    if (!answer || !answer.trim()) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Vui lòng nhập câu trả lời'
      });
    }

    // Get product to check ownership
    const product = await productService.findById(proid);
    if (!product) {
      return res.status(404).json({
        result_code: -1,
        result_message: 'Không tìm thấy sản phẩm'
      });
    }

    if (product.seller_id !== req.user.id) {
      return res.status(403).json({
        result_code: -1,
        result_message: 'Bạn không có quyền trả lời câu hỏi này'
      });
    }

    const db = req.app.get('db');

    // Update answer
    await db('product_questions')
      .where({ qid, product_id: proid })
      .update({
        answer: answer.trim(),
        answered_at: db.fn.now(),
        answered_by: req.user.id
      });

    res.json({
      result_code: 0,
      result_message: 'Đã trả lời câu hỏi thành công'
    });
  } catch (err) {
    console.error('/api/products/:proid/questions/:qid/answer error', err);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi trả lời câu hỏi'
    });
  }
});

// Request bid permission (bidder)
router.post('/:proid/request-bid-permission', async (req, res) => {
  try {
    const proid = parseInt(req.params.proid);

    if (!req.user) {
      return res.status(401).json({
        result_code: -1,
        result_message: 'Vui lòng đăng nhập'
      });
    }

    // Get product and seller info
    const product = await productService.findByIdWithHighestBidder(proid);
    if (!product) {
      return res.status(404).json({
        result_code: -1,
        result_message: 'Không tìm thấy sản phẩm'
      });
    }

    const db = req.app.get('db');

    // Check if already requested
    const existing = await db('bid_permission_requests')
      .where({ product_id: proid, bidder_id: req.user.id })
      .first();

    if (existing) {
      if (existing.status === 'pending') {
        return res.json({
          result_code: 0,
          result_message: 'Bạn đã gửi yêu cầu trước đó. Vui lòng chờ người bán xét duyệt.'
        });
      } else if (existing.status === 'approved') {
        return res.json({
          result_code: 0,
          result_message: 'Yêu cầu của bạn đã được chấp nhận. Bạn có thể đấu giá ngay.'
        });
      } else {
        return res.json({
          result_code: -1,
          result_message: 'Yêu cầu của bạn đã bị từ chối trước đó.'
        });
      }
    }

    // Insert permission request
    await db('bid_permission_requests').insert({
      product_id: proid,
      bidder_id: req.user.id,
      bidder_name: req.user.username || req.user.email,
      bidder_email: req.user.email,
      bidder_positive_ratings: req.user.positive_ratings || 0,
      bidder_negative_ratings: req.user.negative_ratings || 0,
      bidder_total_ratings: req.user.total_ratings || 0,
      status: 'pending'
    });

    // Send email notification to seller
    if (product.seller_email) {
      const { sendBidPermissionRequestEmail } = await import('../utils/email.js');
      const bidderRating = req.user.total_ratings > 0 
        ? `${req.user.positive_ratings}+ / ${req.user.negative_ratings}- (${((req.user.positive_ratings / req.user.total_ratings) * 100).toFixed(1)}%)`
        : '0+ / 0- (0.0%)';
      
      await sendBidPermissionRequestEmail(
        product.seller_email,
        product.seller_name || 'Người bán',
        product.proname,
        proid,
        req.user.username || req.user.email,
        req.user.email,
        bidderRating
      );
    }

    res.json({
      result_code: 0,
      result_message: 'Đã gửi yêu cầu thành công. Người bán sẽ nhận được email thông báo.'
    });
  } catch (err) {
    console.error('/api/products/:proid/request-bid-permission error', err);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi gửi yêu cầu'
    });
  }
});

// Get bid permission requests for a product (seller only)
router.get('/:proid/bid-permission-requests', async (req, res) => {
  try {
    const proid = parseInt(req.params.proid);

    if (!req.user) {
      return res.status(401).json({
        result_code: -1,
        result_message: 'Vui lòng đăng nhập'
      });
    }

    // Check if user is the seller
    const product = await productService.findById(proid);
    if (!product || product.seller_id !== req.user.id) {
      return res.status(403).json({
        result_code: -1,
        result_message: 'Bạn không có quyền xem danh sách này'
      });
    }

    const db = req.app.get('db');
    const requests = await db('bid_permission_requests')
      .where('product_id', proid)
      .orderBy('requested_at', 'desc')
      .select('*');

    res.json({
      result_code: 0,
      requests: requests
    });
  } catch (err) {
    console.error('/api/products/:proid/bid-permission-requests error', err);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi lấy danh sách yêu cầu'
    });
  }
});

// Approve/Reject bid permission request (seller only)
router.patch('/:proid/bid-permission-requests/:requestId', async (req, res) => {
  try {
    const proid = parseInt(req.params.proid);
    const requestId = parseInt(req.params.requestId);
    const { action } = req.body; // 'approve' or 'reject'

    if (!req.user) {
      return res.status(401).json({
        result_code: -1,
        result_message: 'Vui lòng đăng nhập'
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Hành động không hợp lệ'
      });
    }

    // Check if user is the seller
    const product = await productService.findById(proid);
    if (!product || product.seller_id !== req.user.id) {
      return res.status(403).json({
        result_code: -1,
        result_message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    const db = req.app.get('db');
    
    // Update request status
    await db('bid_permission_requests')
      .where({ request_id: requestId, product_id: proid })
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: db.fn.now(),
        reviewed_by: req.user.id
      });

    res.json({
      result_code: 0,
      result_message: action === 'approve' ? 'Đã chấp nhận yêu cầu' : 'Đã từ chối yêu cầu'
    });
  } catch (err) {
    console.error('/api/products/:proid/bid-permission-requests/:requestId error', err);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi xử lý yêu cầu'
    });
  }
});

export default router;