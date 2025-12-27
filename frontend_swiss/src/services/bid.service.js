import axios from "axios";

const instance = axios.create({
  baseURL: 'http://localhost:3000/api/bids',
  timeout: 20000,
  withCredentials: true // Important for session cookies
});

// Get bid information (eligibility, suggested bid, etc.)
export async function getBidInfo(productId) {
  try {
    const resp = await instance.get(`/info/${productId}`);
    return resp.data;
  } catch (error) {
    console.error('getBidInfo error:', error.response?.data || error.message);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

// Place a bid
export async function placeBid(productId, bidAmount) {
  try {
    const resp = await instance.post('/place', {
      productId,
      bidAmount
    });
    return resp.data;
  } catch (error) {
    console.error('placeBid error:', error.response?.data || error.message);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

// Get bid history for a product
export async function getBidHistory(productId) {
  try {
    const resp = await instance.get(`/history/${productId}`);
    return resp.data;
  } catch (error) {
    console.error('getBidHistory error:', error.response?.data || error.message);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

// Buy now - immediately purchase at buy_now_price
export async function buyNow(productId) {
  try {
    const resp = await instance.post('/buy-now', {
      productId
    });
    return resp.data;
  } catch (error) {
    console.error('buyNow error:', error.response?.data || error.message);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

