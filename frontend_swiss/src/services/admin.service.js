import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000/api/admin',
  timeout: 20000,
  withCredentials: true,
  headers: { 'apiKey': '12345ABCDE' }
});

export async function listUsers() {
  const res = await instance.get('/users');
  return res.data;
}

export async function listProducts() {
  const res = await instance.get('/products');
  return res.data;
}

export async function removeProduct(id) {
  const res = await instance.post(`/products/${id}/remove`);
  return res.data;
}

export async function listSellerRequests() {
  const res = await instance.get('/seller-requests');
  return res.data;
}

export async function approveSellerRequest(id) {
  const res = await instance.post(`/seller-requests/${id}/approve`);
  return res.data;
}

export async function rejectSellerRequest(id, note) {
  const res = await instance.post(`/seller-requests/${id}/reject`, { note });
  return res.data;
}

export async function updateUser(id, data) {
  const res = await instance.patch(`/users/${id}`, data);
  return res.data;
}
