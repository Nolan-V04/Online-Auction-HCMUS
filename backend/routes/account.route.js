import express from 'express';
import bcrypt from 'bcryptjs';
import * as userService from '../services/user.service.js';
import { isAuth } from '../middlewares/auth.mdw.js';

const router = express.Router();

router.get('/signup', function (req, res) {
  res.render('vwAccount/signup');
});

router.post('/signup', async function (req, res) {
  const hashPassword = bcrypt.hashSync(req.body.password, 10);
  const user = {
    username: req.body.username,
    email: req.body.email,
    name: req.body.fullname,
    dob: req.body.dob,
    password: hashPassword,
    permission: 0
  }
  await userService.add(user);
  res.render('vwAccount/signup');
});

router.get('/signin', function (req, res) {
  res.render('vwAccount/signin');
});

router.post('/signin', async function (req, res) {
  const username = req.body.username;
  const user = await userService.findByUsername(username);
  if (!user) {
    return res.render('vwAccount/signin', {
      err_message: 'Invalid username or password.'
    });
  }

  const password = req.body.password;
  const ret = bcrypt.compareSync(password, user.password);
  if (ret === false) {
    return res.render('vwAccount/signin', {
      err_message: 'Invalid username or password.'
    });
  }

  req.session.isAuthenticated = true;
  req.session.authUser = user;
  const retUrl = req.session.retUrl || '/';
  delete req.session.retUrl;
  res.redirect(retUrl);
});

router.get('/profile', isAuth, function (req, res) {
  res.render('vwAccount/profile', {
    user: req.session.authUser
  });
});

router.post('/profile', isAuth, async function (req, res) {
  const id = req.body.id;
  const user = {
    name: req.body.fullname,
    email: req.body.email
  };
  await userService.update(id, user);

  req.session.authUser.name = user.name;
  req.session.authUser.email = user.email;

  res.render('vwAccount/profile', {
    user: req.session.authUser
  });
});

router.get('/change-password', isAuth, function (req, res) {
  res.render('vwAccount/change-password');
});

router.post('/change-password', isAuth, function (req, res) {
  res.render('vwAccount/change-password');
});

router.post('/signout', isAuth, function (req, res) {
  req.session.isAuthenticated = false;
  delete req.session.authUser;
  const retUrl = req.headers.referer || '/';
  res.redirect(retUrl);
});

export default router;