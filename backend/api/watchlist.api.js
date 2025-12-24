import express from 'express';
import * as userService from '../services/user.service.js';
import * as productService from '../services/product.service.js';

const router = express.Router();

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      result_code: -1,
      result_message: 'Vui lòng đăng nhập để sử dụng tính năng này'
    });
  }
  next();
}

// Get user's watchlist
router.get('/', requireAuth, async (req, res) => {
  try {
    const watchlist = await userService.getWatchlist(req.user.id);
    res.json({
      result_code: 0,
      result_message: 'Success',
      watchlist
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi lấy danh sách yêu thích'
    });
  }
});

// Get watchlist with product details
router.get('/products', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const offset = (page - 1) * limit;

    const watchlist = await userService.getWatchlist(req.user.id);
    
    if (!watchlist || watchlist.length === 0) {
      return res.json({
        result_code: 0,
        result_message: 'Success',
        products: [],
        total: 0,
        page,
        limit
      });
    }

    // Get products by IDs with pagination
    const products = await productService.findByIds(watchlist, limit, offset);
    const total = watchlist.length;

    res.json({
      result_code: 0,
      result_message: 'Success',
      products,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Get watchlist products error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi lấy sản phẩm yêu thích'
    });
  }
});

// Add product to watchlist
router.post('/add/:productId', requireAuth, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    
    if (isNaN(productId)) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Product ID không hợp lệ'
      });
    }

    // Check if product exists
    const product = await productService.findById(productId);
    if (!product) {
      return res.status(404).json({
        result_code: -1,
        result_message: 'Sản phẩm không tồn tại'
      });
    }

    const result = await userService.addToWatchlist(req.user.id, productId);
    
    res.json({
      result_code: 0,
      result_message: 'Đã thêm vào danh sách yêu thích',
      watchlist: result.rows[0]?.watchlist || []
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi thêm vào danh sách yêu thích'
    });
  }
});

// Remove product from watchlist
router.delete('/remove/:productId', requireAuth, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    
    if (isNaN(productId)) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Product ID không hợp lệ'
      });
    }

    const result = await userService.removeFromWatchlist(req.user.id, productId);
    
    res.json({
      result_code: 0,
      result_message: 'Đã xóa khỏi danh sách yêu thích',
      watchlist: result.rows[0]?.watchlist || []
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi xóa khỏi danh sách yêu thích'
    });
  }
});

// Check if product is in watchlist
router.get('/check/:productId', requireAuth, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    
    if (isNaN(productId)) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Product ID không hợp lệ'
      });
    }

    const exists = await userService.isInWatchlist(req.user.id, productId);
    
    res.json({
      result_code: 0,
      result_message: 'Success',
      exists
    });
  } catch (error) {
    console.error('Check watchlist error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi khi kiểm tra danh sách yêu thích'
    });
  }
});

export default router;
