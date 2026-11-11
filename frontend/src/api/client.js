/**
 * src/api/client.js
 *
 * Centralized Axios instance for all backend API calls.
 *
 * WHY this file exists:
 *   Rather than hard-coding the backend URL in every component, we configure
 *   Axios once here. All pages import this `apiClient` and call `.get()`,
 *   `.post()`, etc. — if the backend URL ever changes, we update ONE file.
 *
 * Base URL resolution (priority order):
 *   1. VITE_API_BASE_URL from .env  (e.g. for production deployment)
 *   2. Falls back to http://localhost:5001/api  (local development default)
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15-second timeout — avoids hanging requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ────────────────────────────────────────────────────
// Runs before every outgoing request. Useful for attaching auth tokens later.
apiClient.interceptors.request.use(
  (config) => {
    // Future: attach JWT token from localStorage if auth is added
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────────────────────────────────────────
// Runs after every response. Normalises errors so components see a consistent
// error shape:  { message: string, status: number }
apiClient.interceptors.response.use(
  (response) => response, // 2xx responses pass through unchanged
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';
    const status = error.response?.status || 0;

    // Log to console in development for quick debugging
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${status}: ${message}`, error);
    }

    // Re-throw a normalised error object for components to catch
    return Promise.reject({ message, status, originalError: error });
  }
);

export default apiClient;

// ─── Convenience named exports for each domain ──────────────────────────────
// Components can do:  import { productsApi } from '../api/client'
// instead of:        import apiClient from '../api/client'; apiClient.get('/products')

export const productsApi = {
  getAll: () => apiClient.get('/products'),
  getById: (id) => apiClient.get(`/products/${id}`),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
};

export const inventoryApi = {
  getAll: () => apiClient.get('/inventory'),
  create: (data) => apiClient.post('/inventory', data),
  updateStock: (id, data) => apiClient.put(`/inventory/${id}`, data),
};

export const competitorApi = {
  getAll: (productId) =>
    apiClient.get('/competitor-prices', { params: productId ? { productId } : {} }),
  create: (data) => apiClient.post('/competitor-prices', data),
  update: (id, data) => apiClient.put(`/competitor-prices/${id}`, data),
  compare: (productId) => apiClient.get(`/competitor-prices/compare/${productId}`),
};

export const pricingApi = {
  calculate: (data) => apiClient.post('/pricing/calculate-price', data),
  getHistory: (productId) =>
    apiClient.get('/pricing/history', { params: productId ? { productId } : {} }),
};

export const healthApi = {
  check: () => apiClient.get('/health'),
};
