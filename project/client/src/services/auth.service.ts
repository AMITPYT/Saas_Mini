import { api, ApiResponse, getErrorMessage } from './api';
import { useAuthStore, User } from '../store/authStore';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  expiresAt: string;
}

export interface TokenResponse {
  accessToken: string;
  expiresAt: string;
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    const authData = response.data.data;

    useAuthStore.getState().login(authData.user, authData.accessToken);

    return authData;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const authData = response.data.data;

    useAuthStore.getState().login(authData.user, authData.accessToken);

    return authData;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', getErrorMessage(error));
    } finally {
      useAuthStore.getState().logout();
    }
  }

  async refreshToken(): Promise<TokenResponse> {
    const response = await api.post<ApiResponse<TokenResponse>>('/auth/refresh');
    const tokenData = response.data.data;

    useAuthStore.getState().setAccessToken(tokenData.accessToken);

    return tokenData;
  }

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  }

  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/profile');
    const { user } = response.data.data;

    useAuthStore.getState().setUser(user);

    return user;
  }

  async updateProfile(data: { name?: string; avatar?: string }): Promise<User> {
    const response = await api.patch<ApiResponse<{ user: User }>>('/auth/profile', data);
    const { user } = response.data.data;

    useAuthStore.getState().setUser(user);

    return user;
  }
}

export const authService = new AuthService();
