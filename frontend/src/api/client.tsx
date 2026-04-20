// src/api/client.ts
import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
  type TokenPair,
} from '../auth/tokenStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/', // Django backend base URL
});

// --- Request interceptor: attach access token ---
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// --- Refresh token helper ---
let isRefreshing = false;
console.log(isRefreshing);
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const resp = await axios.post<TokenPair>(
          'http://127.0.0.1:8000/api/auth/token/refresh/',
          { refresh: refreshToken },
        );
        // save new access + refresh tokens
        saveTokens(resp.data);
        return resp.data.access;
      } catch (err) {
        console.error('Refresh token failed', err);
        clearTokens(); // also clears BU selection
        return null;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

// --- Response interceptor: handle 401 globally with refresh ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    const originalRequest = config as any;

    if (response && response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh access token
      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
        // set new Authorization header and retry
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      }

      // Refresh failed or no refresh token: redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default api;
