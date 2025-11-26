import { create } from 'zustand';
import { authApi } from '@/services/api';
import type { User, LoginRequest } from '@/types';

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
  clearError: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  /**
   * Login with username and password
   */
  login: async (credentials: LoginRequest) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authApi.login(credentials);

      // Store in localStorage
      localStorage.setItem('sfe_access_token', response.accessToken);
      localStorage.setItem('sfe_user', JSON.stringify(response.user));

      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  /**
   * Demo mode login (no password required)
   */
  loginDemo: async (username: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authApi.loginDemo(username);

      // Store in localStorage
      localStorage.setItem('sfe_access_token', response.accessToken);
      localStorage.setItem('sfe_user', JSON.stringify(response.user));

      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Demo login failed. Please try again.';
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('sfe_access_token');
      localStorage.removeItem('sfe_user');

      // Clear state
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Initialize auth from localStorage (for page refresh)
   */
  initAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sfe_access_token');
      const userStr = localStorage.getItem('sfe_user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({
            user,
            accessToken: token,
            isAuthenticated: true,
          });
        } catch (error) {
          // Invalid data in localStorage, clear it
          localStorage.removeItem('sfe_access_token');
          localStorage.removeItem('sfe_user');
        }
      }
    }
  },
}));
