import express from 'express';
import * as categoryService from '../services/category.service.js';

const router = express.Router();

router.get('/', async function (req, res) {
  const list = await categoryService.findAll();
  res.json({
    result_code: 0, // success
    result_message: 'Success',
    categories: list
  });
});

// category tree: GET /api/categories/tree?counts=true|false
router.get('/tree', async function (req, res) {
  try {
    const counts = req.query.counts !== 'false';
    const tree = await categoryService.findTree(counts);
    res.json({ result_code: 0, result_message: 'Success', categories: tree });
  } catch (err) {
    console.error('/api/categories/tree error', err);
    res.status(500).json({ result_code: -1, result_message: err.message });
  }
});

router.get('/:id', async function (req, res) {
  const id = req.params.id;
  const category = await categoryService.findById(id);
  if (category) {
    res.json({
      result_code: 0, // success
      result_message: 'Success',
      category: category
    });
  } else {
    res.status(200).json({
      result_code: -1, // error
      result_message: 'Category not found'
    });
  }
});

router.post('/', async function (req, res) {
  const newCategory = req.body;
  try {
    const returned = await categoryService.add(newCategory);
    res.status(201).json({
      result_code: 0, // success
      result_message: 'Category created successfully',
      category: {
        catid: returned[0].catid,
        ...newCategory
      }
    });
  } catch (error) {
    res.status(500).json({
      result_code: -100, // error
      result_message: 'Error creating category'
    });
  }
});

router.delete('/:id', async function (req, res) {
  const id = req.params.id;
  try {
    const affectedRows = await categoryService.del(id);
    if (affectedRows > 0) {
      res.json({
        result_code: 0, // success
        result_message: 'Category deleted successfully'
      });
    } else {
      res.status(200).json({
        result_code: -1, // error
        result_message: 'Category not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      result_code: -100, // error
      result_message: 'Error deleting category'
    });
  }
});

router.patch('/:id', async function (req, res) {
  const id = req.params.id;
  const updatedCategory = req.body;
  try {
    const affectedRows = await categoryService.patch(id, updatedCategory);
    if (affectedRows > 0) {
      res.json({
        result_code: 0, // success
        result_message: 'Category updated successfully',
        category: {
          catid: id,
          ...updatedCategory
        }
      });
    } else {
      res.status(200).json({
        result_code: -1, // error
        result_message: 'Category not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      result_code: -100, // error
      result_message: 'Error updating category'
    });
  }
});

export default router;