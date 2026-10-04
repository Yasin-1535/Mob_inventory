import axios from 'axios';

// In production on Vercel Services, relative path '/api' reaches the backend via service rewrites.
// In local development, falls back to local backend server at http://localhost:5000/api.
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  try {
    const token =
      localStorage.getItem('smart_inventory_token') ||
      sessionStorage.getItem('smart_inventory_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore storage read error
  }
  return config;
});

export default api;

