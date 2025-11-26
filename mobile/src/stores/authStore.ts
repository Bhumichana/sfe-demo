import { create } from 'zustand';
import type { User, LoginRequest } from '../types';
import { authApi } from '../services/api';
import api from '../services/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  loginDemo: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authApi.login(credentials);

      // Set token in axios header
      api.defaults.headers.common['Authorization'] = `Bearer ${response.accessToken}`;

      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // Store token in AsyncStorage (would be added later)
      // await AsyncStorage.setItem('accessToken', response.accessToken);
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  loginDemo: async (username: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authApi.loginDemo(username);

      // Set token in axios header
      api.defaults.headers.common['Authorization'] = `Bearer ${response.accessToken}`;

      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Demo login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token from axios header
      delete api.defaults.headers.common['Authorization'];

      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });

      // Remove token from AsyncStorage
      // await AsyncStorage.removeItem('accessToken');
    }
  },

  setUser: (user: User) => {
    set({ user });
  },

  setToken: (token: string) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ accessToken: token, isAuthenticated: true });
  },

  clearError: () => {
    set({ error: null });
  },
}));
