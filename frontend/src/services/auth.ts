import api from './api';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/token/', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  verifyOTP: async (email: string, otp: string) => {
    const response = await api.post('/auth/verify-otp/', { email, otp });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me/');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};