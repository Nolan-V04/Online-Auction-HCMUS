import express from 'express';
import bcrypt from 'bcryptjs';
import * as userService from '../services/user.service.js';
import * as ratingService from '../services/rating.service.js';
import * as sellerRequestService from '../services/sellerRequest.service.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      result_code: -1,
      result_message: 'Vui lòng đăng nhập để sử dụng tính năng này'
    });
  }
  next();
}

// Get current profile
router.get('/', requireAuth, async (req, res) => {
  const user = await userService.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ result_code: -1, result_message: 'User not found' });
  }
  res.json({
    result_code: 0,
    result_message: 'Success',
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      positive_ratings: user.positive_ratings || 0,
      negative_ratings: user.negative_ratings || 0,
      total_ratings: user.total_ratings || 0
    }
  });
});

// Update basic profile (name, email)
router.patch('/', requireAuth, async (req, res) => {
  try {
    const { name, email } = req.body || {};
    const user = await userService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ result_code: -1, result_message: 'User not found' });
    }

    if (email && email !== user.email) {
      const existed = await userService.findByEmail(email);
      if (existed && existed.id !== user.id) {
        return res.status(409).json({ result_code: -1, result_message: 'Email đã được sử dụng' });
      }
    }

    await userService.update(user.id, {
      name: name ?? user.name,
      email: email ?? user.email,
      updated_at: new Date()
    });

    res.json({ result_code: 0, result_message: 'Cập nhật thông tin thành công' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ result_code: -1, result_message: 'Lỗi khi cập nhật hồ sơ' });
  }
});

// Change password (requires old password)
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ result_code: -1, result_message: 'Thiếu mật khẩu cũ hoặc mới' });
    }

    const user = await userService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ result_code: -1, result_message: 'User not found' });
    }

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) {
      return res.status(400).json({ result_code: -1, result_message: 'Mật khẩu cũ không đúng' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await userService.update(user.id, {
      password: hashed,
      updated_at: new Date()
    });

    res.json({ result_code: 0, result_message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ result_code: -1, result_message: 'Lỗi khi đổi mật khẩu' });
  }
});

// Ratings summary + list for current user
router.get('/ratings', requireAuth, async (req, res) => {
  try {
    const [summary, list] = await Promise.all([
      ratingService.getRatingSummary(req.user.id),
      ratingService.getRatingsForUser(req.user.id)
    ]);

    res.json({
      result_code: 0,
      result_message: 'Success',
      summary,
      ratings: list
    });
  } catch (err) {
    console.error('Get ratings error:', err);
    res.status(500).json({ result_code: -1, result_message: 'Lỗi khi lấy đánh giá' });
  }
});

// Seller upgrade request status
router.get('/seller-request', requireAuth, async (req, res) => {
  const latest = await sellerRequestService.getLatestByUser(req.user.id);
  res.json({
    result_code: 0,
    result_message: 'Success',
    request: latest
  });
});

// Create seller upgrade request (7 days default)
router.post('/seller-request', requireAuth, async (req, res) => {
  try {
    if (req.user.role_id === 2) {
      return res.status(400).json({ result_code: -1, result_message: 'Bạn đã là người bán' });
    }

    const requestedDays = req.body?.requested_days || 7;
    const created = await sellerRequestService.createRequest(req.user.id, requestedDays);

    if (created?.error) {
      return res.status(400).json({ result_code: -1, result_message: created.error });
    }

    res.json({ result_code: 0, result_message: 'Đã gửi yêu cầu nâng cấp. Vui lòng chờ admin duyệt.', request: created });
  } catch (err) {
    console.error('Create seller request error:', err);
    res.status(500).json({ result_code: -1, result_message: 'Lỗi khi gửi yêu cầu' });
  }
});

export default router;
