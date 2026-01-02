import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance with credentials for session cookies
const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true // Important for session cookies
});

// Get order completion by product ID
export async function getOrderCompletionByProduct(proid) {
  const response = await axiosInstance.get(`/order-completion/product/${proid}`);
  return response.data;
}

// Submit payment info (Step 1 - Buyer)
export async function submitPaymentInfo(orderCompletionId, payment_proof, shipping_address) {
  const response = await axiosInstance.post(
    `/order-completion/${orderCompletionId}/payment`,
    { payment_proof, shipping_address }
  );
  return response.data;
}

// Confirm shipping (Step 2 - Seller)
export async function confirmShipping(orderCompletionId, shipping_invoice) {
  const response = await axiosInstance.post(
    `/order-completion/${orderCompletionId}/shipping`,
    { shipping_invoice }
  );
  return response.data;
}

// Confirm received (Step 3 - Buyer)
export async function confirmReceived(orderCompletionId) {
  const response = await axiosInstance.post(
    `/order-completion/${orderCompletionId}/received`,
    {}
  );
  return response.data;
}

// Submit or update rating (Step 4 - Both)
export async function submitRating(orderCompletionId, rating, comment) {
  const response = await axiosInstance.post(
    `/order-completion/${orderCompletionId}/rating`,
    { rating, comment }
  );
  return response.data;
}

// Cancel transaction (Seller only)
export async function cancelTransaction(orderCompletionId, reason) {
  const response = await axiosInstance.post(
    `/order-completion/${orderCompletionId}/cancel`,
    { reason }
  );
  return response.data;
}

// Get chat messages
export async function getChatMessages(orderCompletionId) {
  const response = await axiosInstance.get(
    `/order-completion/${orderCompletionId}/chat`
  );
  return response.data;
}

// Send chat message
export async function sendChatMessage(orderCompletionId, message) {
  const response = await axiosInstance.post(
    `/order-completion/${orderCompletionId}/chat`,
    { message }
  );
  return response.data;
}
