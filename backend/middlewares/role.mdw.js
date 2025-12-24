export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      result_code: -1,
      result_message: 'Vui lòng đăng nhập'
    });
  }
  next();
}

export function requireRoles(roleIds = []) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ result_code: -1, result_message: 'Vui lòng đăng nhập' });
    }
    if (!roleIds.includes(req.user.role_id)) {
      return res.status(403).json({ result_code: -1, result_message: 'Không đủ quyền truy cập' });
    }
    next();
  };
}

export const requireAdmin = requireRoles([3]);
export const requireSeller = requireRoles([2]);
