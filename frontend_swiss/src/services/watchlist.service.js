import axios from "axios";

const instance = axios.create({
  baseURL: 'http://localhost:3000/api/watchlist',
  timeout: 20000,
  withCredentials: true // Important for session cookies
});

// Get user's watchlist (just IDs)
export async function getWatchlist() {
  try {
    const resp = await instance.get('/');
    return resp.data;
  } catch (error) {
    console.error('getWatchlist error:', error.response?.data || error.message);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

// Get watchlist with full product details and pagination
export async function getWatchlistProducts(page = 1, limit = 8) {
  try {
    const resp = await instance.get('/products', {
      params: { page, limit }
    });
    return resp.data;
  } catch (error) {
    console.error('getWatchlistProducts error:', error.response?.data || error.message);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

// Add product to watchlist
export async function addToWatchlist(productId) {
  try {
    const resp = await instance.post(`/add/${productId}`);
    return resp.data;
  } catch (error) {
    console.error('addToWatchlist error:', error.response?.data || error.message);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

// Remove product from watchlist
export async function removeFromWatchlist(productId) {
  try {
    const resp = await instance.delete(`/remove/${productId}`);
    return resp.data;
  } catch (error) {
    console.error('removeFromWatchlist error:', error.response?.data || error.message);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

// Check if product is in watchlist
export async function checkInWatchlist(productId) {
  try {
    const resp = await instance.get(`/check/${productId}`);
    return resp.data;
  } catch (error) {
    console.error('checkInWatchlist error:', error.response?.data || error.message);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}
