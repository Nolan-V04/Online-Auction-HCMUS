import axios from "axios";
import { LoadingContext } from "../contexts/LoadingContext";

const instance = axios.create({
  baseURL: 'http://localhost:3000/api/',
  timeout: 20000,
  headers: { 'apiKey': '12345ABCDE' }
});

// Setup interceptors to track loading state
export function setupLoadingInterceptor(loadingContext) {
  instance.interceptors.request.use(
    (config) => {
      loadingContext.startLoading();
      return config;
    },
    (error) => {
      loadingContext.stopLoading();
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => {
      loadingContext.stopLoading();
      return response;
    },
    (error) => {
      loadingContext.stopLoading();
      return Promise.reject(error);
    }
  );
}

export async function requestOtp(payload) {
  try {
    const resp = await instance.post('users/request-otp', payload);
    return resp.data;
  } catch (error) {
    console.error('requestOtp error:', error.response?.data || error.message);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

export async function verifyOtp(payload) {
  try {
    const resp = await instance.post('users/verify-otp', payload);
    return resp.data;
  } catch (error) {
    console.error('verifyOtp error:', error.response?.data || error.message);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

