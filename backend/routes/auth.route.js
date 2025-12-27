import express from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { sendPasswordChangeOtpEmail } from '../utils/email.js';
import db from '../utils/db.js';

const router = express.Router();

// Store OTP temporarily (in production, use Redis or database)
const otpStore = new Map(); // { userId: { otp, oldPassword, newPassword, expiresAt } }

// ===== LOCAL LOGIN (Username/Password) =====
router.post('/login', passport.authenticate('local', { session: true }), (req, res) => {
  res.json({
    result_code: 0,
    result_message: 'Đăng nhập thành công',
    user: {
      id: req.user.id,
      username: req.user.username,
      name: req.user.name,
      email: req.user.email,
      role_id: req.user.role_id
    }
  });
});

// ===== GET CURRENT USER (check if logged in) =====
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      result_code: -1,
      result_message: 'Not authenticated'
    });
  }

  res.json({
    result_code: 0,
    result_message: 'Success',
    user: {
      id: req.user.id,
      username: req.user.username,
      name: req.user.name,
      email: req.user.email,
      role_id: req.user.role_id
    }
  });
});

// ===== LOGOUT =====
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        result_code: -1,
        result_message: 'Logout failed'
      });
    }
    res.json({
      result_code: 0,
      result_message: 'Logout successful'
    });
  });
});

// ===== REQUEST PASSWORD CHANGE OTP =====
router.post('/request-password-change-otp', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        result_code: -1,
        result_message: 'Vui lòng đăng nhập'
      });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Thiếu thông tin mật khẩu'
      });
    }

    // Get user from database
    const user = await db('users').where({ id: req.user.id }).first();

    if (!user) {
      return res.status(404).json({
        result_code: -1,
        result_message: 'Không tìm thấy người dùng'
      });
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Mật khẩu cũ không chính xác'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStore.set(user.id, {
      otp,
      oldPassword,
      newPassword,
      expiresAt
    });

    // Send OTP email
    const emailResult = await sendPasswordChangeOtpEmail(user.email, otp, user.name || user.username);

    if (!emailResult.success) {
      return res.status(500).json({
        result_code: -1,
        result_message: 'Không thể gửi email OTP'
      });
    }

    res.json({
      result_code: 0,
      result_message: 'Mã OTP đã được gửi đến email của bạn'
    });

  } catch (error) {
    console.error('Request password change OTP error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi server'
    });
  }
});

// ===== VERIFY OTP AND CHANGE PASSWORD =====
router.post('/verify-and-change-password', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        result_code: -1,
        result_message: 'Vui lòng đăng nhập'
      });
    }

    const { otp, oldPassword, newPassword } = req.body;

    if (!otp || !oldPassword || !newPassword) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Thiếu thông tin'
      });
    }

    // Get stored OTP
    const storedData = otpStore.get(req.user.id);

    if (!storedData) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Không tìm thấy mã OTP. Vui lòng yêu cầu mã mới'
      });
    }

    // Check if OTP expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(req.user.id);
      return res.status(400).json({
        result_code: -1,
        result_message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới'
      });
    }

    // Verify OTP
    if (otp !== storedData.otp) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Mã OTP không chính xác'
      });
    }

    // Verify passwords match
    if (oldPassword !== storedData.oldPassword || newPassword !== storedData.newPassword) {
      return res.status(400).json({
        result_code: -1,
        result_message: 'Thông tin mật khẩu không khớp'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db('users')
      .where({ id: req.user.id })
      .update({ password: hashedPassword });

    // Clear OTP from store
    otpStore.delete(req.user.id);

    res.json({
      result_code: 0,
      result_message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Verify and change password error:', error);
    res.status(500).json({
      result_code: -1,
      result_message: 'Lỗi server'
    });
  }
});

export default router;
