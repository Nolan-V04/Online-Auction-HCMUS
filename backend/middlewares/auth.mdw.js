export function isAuth(req, res, next) {
  if (!req.session.isAuthenticated) {
    req.session.retUrl = req.originalUrl;
    return res.redirect('/account/signin');
  }

  next();
}

export function isAdmin(req, res, next) {
  if (req.session.authUser.permission !== 1) {
    return res.render('403');
  }

  next();
}