import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000/api/profile',
  timeout: 20000,
  withCredentials: true,
  headers: { 'apiKey': '12345ABCDE' }
});

export async function getProfile() {
  const res = await instance.get('/');
  return res.data;
}

export async function updateProfile(payload) {
  const res = await instance.patch('/', payload);
  return res.data;
}

export async function changePassword(payload) {
  const res = await instance.post('/change-password', payload);
  return res.data;
}

export async function getRatings() {
  const res = await instance.get('/ratings');
  return res.data;
}

export async function getSellerRequest() {
  const res = await instance.get('/seller-request');
  return res.data;
}

export async function createSellerRequest(requested_days = 7) {
  const res = await instance.post('/seller-request', { requested_days });
  return res.data;
}
