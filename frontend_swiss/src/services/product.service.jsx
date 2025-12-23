import axios from "axios";

const instance = axios.create({
  baseURL: 'http://localhost:3000/api/',
  timeout: 20000,
  headers: { 'apiKey': '12345ABCDE' }
});

export async function fetchTopEnding() { 
    return (await instance.get('/products/top-ending')).data.products; 
}

export async function fetchTopBids()   { 
    return (await instance.get('/products/top-bids')).data.products; 
}

export async function fetchTopPrice()  { 
    return (await instance.get('/products/top-price')).data.products; 
}

export async function fetchProducts({ catid, page = 1, limit = 8 } = {}) {
  const res = await instance.get('/products', {
    params: { catid, page, limit }
  });
  if (res.status === 200) return res.data;
  throw new Error('Failed to fetch products');
}
