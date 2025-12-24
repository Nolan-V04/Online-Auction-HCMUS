import axios from "axios";
import { LoadingContext } from "../contexts/LoadingContext";

const authInstance = axios.create({
  baseURL: 'http://localhost:3000/',
  timeout: 20000,
  withCredentials: true // Important for session cookies
});

const apiInstance = axios.create({
  baseURL: 'http://localhost:3000/api/',
  timeout: 20000,
  headers: { 'apiKey': '12345ABCDE' }
});

// Setup interceptors to track loading state
export function setupLoadingInterceptor(loadingContext) {
  // Auth instance interceptors
  authInstance.interceptors.request.use(
    (config) => {
      loadingContext.startLoading();
      return config;
    },
    (error) => {
      loadingContext.stopLoading();
      return Promise.reject(error);
    }
  );

  authInstance.interceptors.response.use(
    (response) => {
      loadingContext.stopLoading();
      return response;
    },
    (error) => {
      loadingContext.stopLoading();
      return Promise.reject(error);
    }
  );

  // API instance interceptors
  apiInstance.interceptors.request.use(
    (config) => {
      loadingContext.startLoading();
      return config;
    },
    (error) => {
      loadingContext.stopLoading();
      return Promise.reject(error);
    }
  );

  apiInstance.interceptors.response.use(
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

// Auth API calls
export async function loginLocal(username, password) {
  try {
    const resp = await authInstance.post('auth/login', { username, password });
    return resp.data;
  } catch (error) {
    console.error('loginLocal error:', error.response?.data || error.message);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const resp = await authInstance.get('auth/me');
    return resp.data;
  } catch (error) {
    console.error('getCurrentUser error:', error.response?.data || error.message);
    return null;
  }
}

export async function logout() {
  try {
    const resp = await authInstance.post('auth/logout');
    return resp.data;
  } catch (error) {
    console.error('logout error:', error.response?.data || error.message);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

// OAuth login redirects
export function loginWithGoogle() {
  window.location.href = 'http://localhost:3000/auth/google';
}

export function loginWithFacebook() {
  window.location.href = 'http://localhost:3000/auth/facebook';
}

export function loginWithGithub() {
  window.location.href = 'http://localhost:3000/auth/github';
}

export function loginWithTwitter() {
  window.location.href = 'http://localhost:3000/auth/twitter';
}

// User registration API calls
export async function requestOtp(payload) {
  try {
    const resp = await apiInstance.post('users/request-otp', payload);
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
    const resp = await apiInstance.post('users/verify-otp', payload);
    return resp.data;
  } catch (error) {
    console.error('verifyOtp error:', error.response?.data || error.message);
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}
