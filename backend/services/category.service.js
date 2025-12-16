import db from '../utils/db.js';

export function findAll() {
  return db('categories').orderBy('catid', 'asc');
}

export function add(entity) {
  return db('categories').insert(entity).returning('catid');
}

export function findById(id) {
  return db('categories').where('catid', id).first();
}

export function del(id) {
  return db('categories').where('catid', id).del();
}

export function patch(id, entity) {
  return db('categories').where('catid', id).update(entity);
}