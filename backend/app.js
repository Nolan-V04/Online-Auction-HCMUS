import express from 'express';
import { engine } from 'express-handlebars';
import expressHandlebarsSections from 'express-handlebars-sections';
import session from 'express-session';

import { isAdmin, isAuth } from './middlewares/auth.mdw.js';

import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'Q2p7v9L1xR4nT8bF6sM3wZ5eH7kP2dC8aJ4mV9yS6uN3qG7tB5rL1xD8fT4cW7vK2pR6hM3dS9fG5xZ8',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false
  }
}))

// app.engine('handlebars', engine({
//   helpers: {
//     format_currency(value) {
//       return new Intl.NumberFormat('en-US').format(value);
//     },
//     section: expressHandlebarsSections()
//   }
// }));
// app.set('view engine', 'handlebars');
// app.set('views', './views');

app.use('/static', express.static('static'));
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());

app.use(function (req, res, next) {
  res.locals.isAuthenticated = req.session.isAuthenticated;
  res.locals.authUser = req.session.authUser;
  next();
});

// import * as categoryService from './services/category.service.js';
// app.use(async function (req, res, next) {
//   const list = await categoryService.findAll();
//   res.locals.lcCategories = list;
//   next();
// });

// app.get('/', function (req, res) {

//   if (req.session.views) {
//     req.session.views++;
//   } else {
//     req.session.views = 1;
//   }

//   const data = {
//     name: 'John Doe',
//     age: 30,
//     occupation: 'Developer'
//   };
//   res.render('home', data);
// });

// app.get('/view-session', function (req, res) {
//   res.send(`Views: ${req.session.views}`);
// });

// app.get('/account/signup', function (req, res) {
//   res.render('vwAccount/signup');
// });

// app.get('/account/signin', function (req, res) {
//   res.render('vwAccount/signin');
// });

// app.get('/products/byCat', function (req, res) {
//   res.render('vwProducts/byCat');
// });

// app.use('/account', accountRouter);
// app.use('/products', productRouter);
// app.use('/admin/categories', isAuth, isAdmin, adminCategoryRouter);
// // app.use('/admin/products', isAuth, isAdmin, adminProductRouter);
// app.use('/admin/products', adminProductRouter);

import { isApiAuth } from './middlewares/api-auth.mdw.js';
import apiCategoryRouter from './api/category.api.js';
app.use('/api/categories', isApiAuth, apiCategoryRouter);

import apiProductRouter from './api/product.api.js';
app.use('/api/products', isApiAuth, apiProductRouter);

app.use(function (req, res) {
  res.status(404).render('404');
});

app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);
});