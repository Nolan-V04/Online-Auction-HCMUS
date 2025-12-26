import 'dotenv/config';
import express from 'express';
import { engine } from 'express-handlebars';
import expressHandlebarsSections from 'express-handlebars-sections';
import session from 'express-session';
import passport from 'passport';

import { isAdmin, isAuth } from './middlewares/auth.mdw.js';
import { setupPassport } from './config/passport.config.js';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

import db from './utils/db.js';
app.set('db', db);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.set('trust proxy', 1)
app.use(session({
  secret: 'Q2p7v9L1xR4nT8bF6sM3wZ5eH7kP2dC8aJ4mV9yS6uN3qG7tB5rL1xD8fT4cW7vK2pR6hM3dS9fG5xZ8',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    sameSite: 'lax'
  }
}))

// Initialize Passport
setupPassport(passport);
app.use(passport.initialize());
app.use(passport.session());


app.use('/static', express.static('static'));
app.use('/uploads', express.static('static/uploads'));
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());

app.use(function (req, res, next) {
  res.locals.isAuthenticated = req.session.isAuthenticated;
  res.locals.authUser = req.session.authUser;
  next();
});

import { isApiAuth } from './middlewares/api-auth.mdw.js';
import apiCategoryRouter from './api/category.api.js';
app.use('/api/categories', isApiAuth, apiCategoryRouter);

import apiProductRouter from './api/product.api.js';
app.use('/api/products', isApiAuth, apiProductRouter);

import apiUsersRouter from './api/users.api.js';
app.use('/api/users', isApiAuth, apiUsersRouter);

import watchlistRouter from './api/watchlist.api.js';
app.use('/api/watchlist', watchlistRouter);

import bidRouter from './api/bid.api.js';
app.use('/api/bids', bidRouter);

import profileRouter from './api/profile.api.js';
app.use('/api/profile', profileRouter);

import adminRouter from './api/admin.api.js';
app.use('/api/admin', adminRouter);

import sellerRouter from './api/seller.api.js';
app.use('/api/seller/products', sellerRouter);

import authRouter from './routes/auth.route.js';
app.use('/auth', authRouter);

app.use(function (req, res) {
  res.status(404).json({ result_code: -404, result_message: 'Not Found' });
});

import { initDb } from './utils/initDb.js';

initDb()
  .catch(() => {
    // If init fails, continue to start server to allow other endpoints
  })
  .finally(() => {
    app.listen(PORT, function () {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  });