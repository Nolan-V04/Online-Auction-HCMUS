import express from 'express';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '../middlewares/role.mdw.js';
import * as userService from '../services/user.service.js';
import * as productService from '../services/product.service.js';
import * as sellerRequestService from '../services/sellerRequest.service.js';

const router = express.Router();

router.use(requireAdmin);

// Users management
router.get('/users', async (req, res) => {
  const users = await userService.findAll?.() || await req.app.get('db')?.select('*').from('users');
  res.json({ result_code: 0, result_message: 'Success', users });
});

router.get('/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);
  if (!user) return res.status(404).json({ result_code: -1, result_message: 'User not found' });
  res.json({ result_code: 0, result_message: 'Success', user });
});

router.post('/users', async (req, res) => {
  try {
    const userData = { ...req.body };
    // Hash password if provided
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    const [id] = await userService.add(userData);
    res.status(201).json({ result_code: 0, result_message: 'User created', id });
  } catch (error) {
    res.status(500).json({ result_code: -1, result_message: error.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const userData = { ...req.body };
    // Hash password if provided and not empty
    if (userData.password && userData.password.trim() !== '') {
      userData.password = await bcrypt.hash(userData.password, 10);
    } else if (userData.password === '') {
      // Remove password field if empty (don't update password)
      delete userData.password;
    }
    await userService.update(req.params.id, userData);
    res.json({ result_code: 0, result_message: 'Updated' });
  } catch (error) {
    res.status(500).json({ result_code: -1, result_message: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await userService.del(req.params.id);
    res.json({ result_code: 0, result_message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ result_code: -1, result_message: error.message });
  }
});

// Products management
router.get('/products', async (req, res) => {
  const products = await productService.findAll();
  res.json({ result_code: 0, result_message: 'Success', products });
});

// Get product details
router.get('/products/:id', async (req, res) => {
  const product = await productService.findById(req.params.id);
  if (!product) return res.status(404).json({ result_code: -1, result_message: 'Product not found' });
  res.json({ result_code: 0, result_message: 'Success', product });
});

// Add new product
router.post('/products', async (req, res) => {
  try {
    const newProduct = req.body;
    const [proid] = await productService.add(newProduct);
    res.status(201).json({ result_code: 0, result_message: 'Product created', proid });
  } catch (error) {
    res.status(500).json({ result_code: -1, result_message: error.message });
  }
});

// Update a product
router.patch('/products/:id', async (req, res) => {
  try {
    await productService.patch(req.params.id, req.body);
    res.json({ result_code: 0, result_message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ result_code: -1, result_message: error.message });
  }
});

// Remove a product (hard delete)
router.post('/products/:id/remove', async (req, res) => {
  await productService.del(req.params.id);
  res.json({ result_code: 0, result_message: 'Product deleted' });
});

// Seller upgrade requests
router.get('/seller-requests', async (req, res) => {
  const list = await sellerRequestService.listRequests?.() || req.app.get('db')?.select('*').from('seller_upgrade_requests');
  res.json({ result_code: 0, result_message: 'Success', requests: list });
});

router.post('/seller-requests/:id/approve', async (req, res) => {
  const approved = await sellerRequestService.approveRequest(req.params.id, req.user.id, 7);
  res.json({ result_code: 0, result_message: 'Approved', request: approved });
});

router.post('/seller-requests/:id/reject', async (req, res) => {
  const rejected = await sellerRequestService.rejectRequest(req.params.id, req.user.id, req.body?.note);
  res.json({ result_code: 0, result_message: 'Rejected', request: rejected });
});

export default router;
