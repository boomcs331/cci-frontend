// Authentication Service
import { apiFetchJson, getApiUrl } from '@/utils/api';
import { setSession, clearSession } from '@/utils/session';
import type { LoginCredentials, LoginResponse, SignUpData, User } from '../types/user';
import type { ApiResponse } from '../types/api';

export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const endpoint = process.env.NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT || '/auth/login';
    const response = await apiFetchJson<LoginResponse>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    // Save session
    setSession(response);

    return response;
  },

  /**
   * Logout user
   */
  logout: (): void => {
    clearSession();
  },

  /**
   * Sign up new user
   */
  signUp: async (data: SignUpData): Promise<User> => {
    const response = await apiFetchJson<ApiResponse<User>>('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.data!;
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await apiFetchJson<ApiResponse<User>>('/auth/profile');
    return response.data!;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiFetchJson<ApiResponse<User>>('/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.data!;
  },

  /**
   * Change password
   */
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await apiFetchJson('/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword })
    });
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiFetchJson('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  },
};
