import axios from 'axios';

const API_URL = 'http://localhost:3000/api/seller/products';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function getSellerProducts() {
  const res = await axiosInstance.get('/api/seller/products');
  return res.data;
}

export async function getSellerProduct(id) {
  const res = await axiosInstance.get(`/api/seller/products/${id}`);
  return res.data;
}

export async function createAuctionProduct(productData) {
  const res = await axiosInstance.post('/api/seller/products', productData);
  return res.data;
}

export async function updateAuctionProduct(id, productData) {
  const res = await axiosInstance.patch(`/api/seller/products/${id}`, productData);
  return res.data;
}

export async function deleteAuctionProduct(id) {
  const res = await axiosInstance.delete(`/api/seller/products/${id}`);
  return res.data;
}

export async function uploadImages(files) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });
  
  const res = await axiosInstance.post('/api/seller/products/upload-images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}
