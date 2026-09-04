import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { loginRequest, registerRequest } from './api';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => setSession(data),
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: registerRequest,
    onSuccess: (data) => setSession(data),
  });
}
