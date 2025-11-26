import axios from 'axios';
import { API_URL } from '../utils/constants';
import type { AuthResponse, LoginRequest, User } from '../types';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    // Token will be added by auth store
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - logout user
      console.log('Unauthorized - logging out');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  me: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Demo mode login
  loginDemo: async (username: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/demo', { username });
    return response.data;
  },
};

// Users API
export const usersApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },
};

// Export API instance for custom requests
export default api;
