import express from 'express';
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

router.patch('/users/:id', async (req, res) => {
  await userService.update(req.params.id, req.body);
  res.json({ result_code: 0, result_message: 'Updated' });
});

// Products management
router.get('/products', async (req, res) => {
  const products = await productService.findAll();
  res.json({ result_code: 0, result_message: 'Success', products });
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
