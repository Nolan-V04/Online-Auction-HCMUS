import express from 'express';
import passport from 'passport';

const router = express.Router();

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

export default router;
