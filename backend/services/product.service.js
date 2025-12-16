import db from '../utils/db.js';

export function findAll() {
  return db('products');
}

export function add(entity) {
  return db('products').insert(entity).returning('proid');
}

export function findById(id) {
  return db('products').where('proid', id).first();
}

export function del(id) {
  return db('products').where('proid', id).del();
}

export function patch(id, entity) {
  return db('products').where('proid', id).update(entity);
}

export function findByCat(catId) {
  return db('products').where('catid', catId);
}

export function findPageByCat(catId, limit, offset) {
  return db('products').where('catid', catId).limit(limit).offset(offset);
}

export function countByCat(catId) {
  return db('products').where('catid', catId)
    .count('proid as count').first();
}

export function search(keyword) {
  return db('products')
    .whereRaw(`fts @@ to_tsquery(remove_accents('${keyword}'));`);
}

export function findAllWithCat() {
  return db('products as p')
    .join('categories as c', 'p.catid', 'c.catid')
    .select('p.*', 'c.catname')
    .orderBy('p.proid');
}