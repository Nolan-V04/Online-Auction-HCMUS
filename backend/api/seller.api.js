import express from 'express';
import multer from 'multer';
import path from 'path';
import { requireSeller } from '../middlewares/role.mdw.js';
import * as productService from '../services/product.service.js';
import db from '../utils/db.js';

const router = express.Router();

// Only sellers and admins can access these routes
router.use(requireSeller);

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'static/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Get all products for current seller
router.get('/', async (req, res) => {
  try {
    const sellerId = req.user.id;
    const products = await db('products')
      .where('seller_id', sellerId)
      .orderBy('created_at', 'desc');
    
    res.json({ result_code: 0, result_message: 'Success', products });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ result_code: -1, result_message: error.message });
  }
});

// Get single product details
router.get('/:id', async (req, res) => {
  try {
    const sellerId = req.user.id;
    const product = await db('products')
      .where({ proid: req.params.id, seller_id: sellerId })
      .first();
    
    if (!product) {
      return res.status(404).json({ result_code: -1, result_message: 'Product not found or unauthorized' });
    }
    
    res.json({ result_code: 0, result_message: 'Success', product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ result_code: -1, result_message: error.message });
  }
});

// Upload images
router.post('/upload-images', upload.array('images', 10), (req, res) => {
  try {
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ result_code: 0, result_message: 'Images uploaded', imageUrls });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ result_code: -1, result_message: error.message });
  }
});

// Create new auction product
router.post('/', async (req, res) => {
  try {
    const sellerId = req.user.id;
    const {
      proname,
      tinydes,
      fulldes,
      starting_price,
      bid_step,
      buy_now_price,
      auto_extend,
      catid,
      end_time,
      images
    } = req.body;

    // Validation
    if (!proname || !tinydes || !fulldes || !starting_price || !bid_step || !catid || !end_time) {
      return res.status(400).json({ result_code: -1, result_message: 'Missing required fields' });
    }

    if (!images || images.length < 3) {
      return res.status(400).json({ result_code: -1, result_message: 'At least 3 images are required' });
    }

    const newProduct = {
      proname,
      tinydes,
      fulldes,
      price: starting_price, // Keep for compatibility
      starting_price: parseInt(starting_price),
      bid_step: parseInt(bid_step),
      buy_now_price: buy_now_price ? parseInt(buy_now_price) : null,
      auto_extend: auto_extend === true || auto_extend === 'true',
      catid: parseInt(catid),
      quantity: 1, // Auction products are always quantity 1
      seller_id: sellerId,
      end_time,
      images: Array.isArray(images) ? images : [images],
      status: 'active',
      bid_count: 0
    };

    const [proid] = await db('products').insert(newProduct).returning('proid');
    
    res.status(201).json({ 
      result_code: 0, 
      result_message: 'Auction product created successfully', 
      proid: proid.proid || proid 
    });
  } catch (error) {
    console.error('Error creating auction product:', error);
    res.status(500).json({ result_code: -1, result_message: error.message });
  }
});

// Update auction product
router.patch('/:id', async (req, res) => {
  try {
    const sellerId = req.user.id;
    const productId = req.params.id;

    // Check ownership
    const existing = await db('products')
      .where({ proid: productId, seller_id: sellerId })
      .first();
    
    if (!existing) {
      return res.status(404).json({ result_code: -1, result_message: 'Product not found or unauthorized' });
    }

    const {
      proname,
      tinydes,
      fulldes,
      starting_price,
      bid_step,
      buy_now_price,
      auto_extend,
      catid,
      end_time,
      images,
      status
    } = req.body;

    const updates = {};
    if (proname) updates.proname = proname;
    if (tinydes) updates.tinydes = tinydes;
    if (fulldes) updates.fulldes = fulldes;
    if (starting_price) {
      updates.starting_price = parseInt(starting_price);
      updates.price = parseInt(starting_price);
    }
    if (bid_step) updates.bid_step = parseInt(bid_step);
    if (buy_now_price !== undefined) updates.buy_now_price = buy_now_price ? parseInt(buy_now_price) : null;
    if (auto_extend !== undefined) updates.auto_extend = auto_extend === true || auto_extend === 'true';
    if (catid) updates.catid = parseInt(catid);
    if (end_time) updates.end_time = end_time;
    if (images) updates.images = Array.isArray(images) ? images : [images];
    if (status) updates.status = status;

    await db('products').where('proid', productId).update(updates);
    
    res.json({ result_code: 0, result_message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ result_code: -1, result_message: error.message });
  }
});

// Delete auction product (only if no bids)
router.delete('/:id', async (req, res) => {
  try {
    const sellerId = req.user.id;
    const productId = req.params.id;

    // Check ownership
    const existing = await db('products')
      .where({ proid: productId, seller_id: sellerId })
      .first();
    
    if (!existing) {
      return res.status(404).json({ result_code: -1, result_message: 'Product not found or unauthorized' });
    }

    // Check if there are any bids
    const bidCount = await db('bids').where('proid', productId).count('* as count').first();
    if (bidCount && parseInt(bidCount.count) > 0) {
      return res.status(400).json({ 
        result_code: -1, 
        result_message: 'Cannot delete product with existing bids' 
      });
    }

    await db('products').where('proid', productId).del();
    
    res.json({ result_code: 0, result_message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ result_code: -1, result_message: error.message });
  }
});

export default router;
