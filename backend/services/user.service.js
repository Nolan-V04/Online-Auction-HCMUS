import db from '../utils/db.js';

export function add(user) {
  return db('users').insert(user);
}

export function findByUsername(username) {
  return db('users').where('username', username).first();
}

export function update(id, user) {
  return db('users').where('id', id).update(user);
}