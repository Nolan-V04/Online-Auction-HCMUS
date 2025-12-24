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

export async function findRelated(proid, limit = 5) {
  const product = await db('products')
    .select('catid')
    .where('proid', proid)
    .first();

  if (!product) {
    return [];
  }

  return db('products')
    .where('catid', product.catid)
    .andWhere('proid', '<>', proid)
    .orderByRaw('RANDOM()')
    .limit(limit);
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

// Top N products closing soon (require products.end_time) — defined as ending within next 2 weeks
export function findTopEnding(limit = 5) {
  return db('products')
    .whereNotNull('end_time')
    .where('end_time', '>', db.raw('now()'))  
    .orderBy('end_time', 'asc')         
    .limit(limit);
}

// Top N products by number of bids (uses bids table)
export function findTopByBids(limit = 5) {
  return db('products')
    .orderBy('bid_count', 'desc')
    .limit(limit);
}

// Top N products by price
export function findTopByPrice(limit = 5) {
  return db('products')
    .orderBy('price', 'desc')
    .limit(limit);
}
