import express from 'express';
import * as productService from '../services/product.service.js';
import knex from 'knex';

const router = express.Router();

// router.get('/byCat', async function (req, res) {
//   const id = req.query.id || 0;
//   const list = await productService.findByCat(id);
//   res.render('vwProducts/byCat', {
//     products: list,
//     empty: list.length === 0,
//   });
// });

router.get('/byCat', async function (req, res) {
  const id = req.query.id || 0;
  const page = req.query.page || 1;
  const limit = 4;
  const offset = (page - 1) * limit;


  const total = await productService.countByCat(id);
  // console.log(total); // { count: '17' }
  const nPages = Math.ceil(+total.count / limit);
  const pageNumbers = [];
  for (let i = 1; i <= nPages; i++) {
    pageNumbers.push({
      value: i,
      isCurrent: i === +page,
    });
  }
  
  const list = await productService.findPageByCat(id, limit, offset);
  res.render('vwProducts/byCat', {
    products: list,
    empty: list.length === 0,
    pageNumbers: pageNumbers,
    catId: id,
  });
});

router.get('/detail/:id', async function (req, res) {
  const id = req.params.id || 0;
  const p = await productService.findById(id);
  if (p === null) {
    return res.redirect('/');
  }

  res.render('vwProducts/detail', {
    product: p,
  });
});

router.get('/search', async function (req, res) {
  const q = req.query.q || '';
  const kw = q.replace(/ /g, ' & ');
  const list = await productService.search(kw);
  res.render('vwProducts/search', {
    keyword: q,
    products: list,
    empty: list.length === 0,
  });
});

export default router;