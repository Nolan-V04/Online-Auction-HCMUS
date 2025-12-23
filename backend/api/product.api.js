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
      const rows = await productService.findPageByCat(catid, l, offset);
      const countRow = await productService.countByCat(catid);
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

export default router;