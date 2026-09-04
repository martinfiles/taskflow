import { apiClient } from '@/lib/api-client';
import { AuthUser } from '@/store/auth-store';

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function registerRequest(payload: { email: string; password: string; name: string }) {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function loginRequest(payload: { email: string; password: string }) {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}
