import axios, { type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: '/api', // Your backend API base URL
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    console.log('[API Interceptor] Triggered for config:', config.method, config.url);
    // Get token directly from localStorage
    const token = localStorage.getItem('token');
    console.log('[API Interceptor] Token from localStorage:', token ? 'Found' : 'Not found');
    
    if (token) {
      console.log('[API Interceptor] Adding token to Authorization header');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('[API Interceptor] No token found in localStorage');
    }
    return config;
  },
  (error: any) => { // Explicitly typed error
    // Do something with request error
    console.error('[API Interceptor] Request error:', error);
    return Promise.reject(error);
  }
);

export default api;
