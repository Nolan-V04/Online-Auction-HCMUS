import express from 'express';
import * as categoryService from '../services/category.service.js';

const router = express.Router();

router.get('/', async function (req, res) {
  const list = await categoryService.findAll();
  res.render('vwAdminCategory/list', {
    list: list
  });
});

router.get('/add', function (req, res) {
  res.render('vwAdminCategory/add');
});

router.post('/add', async function (req, res) {
  const entity = {
    catname: req.body.categoryName
  }
  await categoryService.add(entity);
  res.render('vwAdminCategory/add');
});

router.get('/edit', async function (req, res) {
  const id = req.query.id || 0;
  const entity = await categoryService.findById(id);
  if (!entity) {
    return res.redirect('/admin/categories');
  }

  res.render('vwAdminCategory/edit', {
    category: entity
  });
});

router.post('/del', async function (req, res) {
  const id = req.body.categoryId ;
  await categoryService.del(id);
  res.redirect('/admin/categories');
});

router.post('/patch', async function (req, res) {
  const id = req.body.categoryId ;
  const entity = {
    catname: req.body.categoryName
  }
  await categoryService.patch(id, entity);
  res.redirect('/admin/categories');
});

export default router;