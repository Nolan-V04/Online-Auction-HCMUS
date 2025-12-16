import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import * as productService from '../services/product.service.js';

const router = express.Router();

router.get('/', async function (req, res) {
  const list = await productService.findAllWithCat();
  res.render('vwAdminProduct/list', {
    list: list
  });
});

router.get('/add', function (req, res) {
  res.render('vwAdminProduct/add', {
    categories: res.locals.lcCategories // thừa thải, không nên có
  });
});

router.post('/add', async function (req, res) {
  const entity = {
    proname: req.body.proname,
    price: req.body.price.replace(/,/g, ''),
    quantity: req.body.quantity.replace(/,/g, ''),
    fulldes: req.body.fulldes,
    tinydes: req.body.tinydes,
    catid: +req.body.catid
  }
  // console.log(entity);
  const returning = await productService.add(entity);
  const proid = returning[0].proid;
  const dirpath = path.join('static', 'imgs', 'sp', proid.toString());
  if(!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true });
  }

  // req.body.photos -> ['file1.jpg', 'file2.jpg', ...]
  if(req.body.photos) {
    const photos = JSON.parse(req.body.photos);
    photos.forEach(function(item, idx) {
      const oldpath = path.join('static', 'uploads', item);
      let newfilename, thumbfilename;
      if(idx === 0) {
        newfilename = 'main.jpg';
        thumbfilename = 'main_thumbs.jpg';
      } else {
        newfilename = `${idx}.jpg`;
        thumbfilename = `${idx}_thumbs.jpg`;
      }

      const newpath = path.join(dirpath, newfilename);
      const thumbpath = path.join(dirpath, thumbfilename);
      fs.copyFileSync(oldpath, newpath);
      fs.copyFileSync(oldpath, thumbpath);
      fs.unlinkSync(oldpath);
    });
  }

  res.render('vwAdminProduct/add');
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'static/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage })

router.post('/upload', upload.array('photo', 5), function (req, res) {
  res.json({
    uploaded: true,
    files: req.files
  });
});

export default router;