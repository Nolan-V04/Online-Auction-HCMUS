import express from 'express';
import { engine } from 'express-handlebars';

import adminCategoryRouter from './routes/admin-category.route.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// app.use('/static', express.static('static'));
// app.use(express.urlencoded({
//   extended: true
// }));

app.get('/', function (req, res) {
  const data = {
    name: 'John Doe',
    age: 30,
    occupation: 'Developer'
  };
  res.render('home', data);
});

app.get('/account/signup', function (req, res) {
  res.render('vwAccount/signup');
});

app.get('/account/signin', function (req, res) {
  res.render('vwAccount/signin');
});

app.get('/products/byCat', function (req, res) {
  res.render('vwProducts/byCat');
});

app.use('/admin/categories', adminCategoryRouter);

app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);
});