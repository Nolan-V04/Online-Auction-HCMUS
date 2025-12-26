import db from '../utils/db.js';

export function findAll() {
  return db('products')
    .where(function() {
      this.whereNull('end_time')
        .orWhere('end_time', '>', db.raw('now()'));
    });
}

export function add(entity) {
  return db('products').insert(entity).returning('proid');
}

export function findById(id) {
  return db('products').where('proid', id).first();
}

// Find product with highest bidder info joined
export function findByIdWithHighestBidder(id) {
  return db('products as p')
    .leftJoin('users as bidder', 'p.highest_bidder', 'bidder.id')
    .leftJoin('users as seller', 'p.seller_id', 'seller.id')
    .select(
      'p.*', 
      'bidder.username as highest_bidder_username', 
      'bidder.name as highest_bidder_name',
      'bidder.positive_ratings as highest_bidder_positive_ratings',
      'bidder.negative_ratings as highest_bidder_negative_ratings',
      'bidder.total_ratings as highest_bidder_total_ratings',
      'seller.username as seller_username',
      'seller.name as seller_name',
      'seller.email as seller_email',
      'seller.positive_ratings as seller_positive_ratings',
      'seller.negative_ratings as seller_negative_ratings',
      'seller.total_ratings as seller_total_ratings'
    )
    .where('p.proid', id)
    .first();
}

export async function findRelated(proid, limit = 5) {
  const product = await db('products')
    .select('catid')
    .where('proid', proid)
    .first();

  if (!product) {
    return [];
  }

  // Get category info to check if it has parent or children
  const category = await db('categories')
    .where('catid', product.catid)
    .first();

  if (!category) {
    return [];
  }

  let categoryIds = [product.catid];

  // If category has a parent, get parent and all siblings
  if (category.parent_id) {
    const siblings = await db('categories')
      .where('parent_id', category.parent_id)
      .select('catid');
    categoryIds = [category.parent_id, ...siblings.map(s => s.catid)];
  } else {
    // If category is a parent, get all children
    const children = await db('categories')
      .where('parent_id', product.catid)
      .select('catid');
    if (children.length > 0) {
      categoryIds = [product.catid, ...children.map(c => c.catid)];
    }
  }

  return db('products')
    .whereIn('catid', categoryIds)
    .andWhere('proid', '<>', proid)
    .where(function() {
      this.whereNull('end_time')
        .orWhere('end_time', '>', db.raw('now()'));
    })
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
  return db('products')
    .where('catid', catId)
    .where(function() {
      this.whereNull('end_time')
        .orWhere('end_time', '>', db.raw('now()'));
    })
    .limit(limit)
    .offset(offset);
}

export function countByCat(catId) {
  return db('products')
    .where('catid', catId)
    .where(function() {
      this.whereNull('end_time')
        .orWhere('end_time', '>', db.raw('now()'));
    })
    .count('proid as count')
    .first();
}

// Find products by multiple category IDs with pagination
export function findPageByMultipleCats(categoryIds, limit, offset) {
  return db('products')
    .whereIn('catid', categoryIds)
    .where(function() {
      this.whereNull('end_time')
        .orWhere('end_time', '>', db.raw('now()'));
    })
    .limit(limit)
    .offset(offset);
}

// Count products by multiple category IDs
export function countByMultipleCats(categoryIds) {
  return db('products')
    .whereIn('catid', categoryIds)
    .where(function() {
      this.whereNull('end_time')
        .orWhere('end_time', '>', db.raw('now()'));
    })
    .count('proid as count')
    .first();
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
    .where(function() {
      this.whereNull('end_time')
        .orWhere('end_time', '>', db.raw('now()'));
    })
    .orderBy('bid_count', 'desc')
    .limit(limit);
}

// Top N products by price
export function findTopByPrice(limit = 5) {
  return db('products')
    .where(function() {
      this.whereNull('end_time')
        .orWhere('end_time', '>', db.raw('now()'));
    })
    .orderBy('price', 'desc')
    .limit(limit);
}

// Find products by array of IDs with pagination
export function findByIds(ids, limit, offset) {
  if (!ids || ids.length === 0) {
    return [];
  }
  
  return db('products')
    .whereIn('proid', ids)
    .where(function() {
      this.whereNull('end_time')
        .orWhere('end_time', '>', db.raw('now()'));
    })
    .orderBy('proid', 'desc')
    .limit(limit)
    .offset(offset);
}
