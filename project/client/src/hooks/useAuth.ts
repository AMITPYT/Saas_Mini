import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  authService,
  LoginCredentials,
  RegisterData,
} from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage } from '../services/api';

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Login successful!');
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useRegister = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Registration successful!');
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onSuccess: () => {
      toast.success('Password reset email sent');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useResetPassword = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authService.resetPassword(token, password),
    onSuccess: () => {
      toast.success('Password reset successful');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useChangePassword = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => authService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Password changed. Please login again.');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useProfile = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getProfile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; avatar?: string }) =>
      authService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

// Hook to check auth status on app load
export const useAuthCheck = () => {
  const { isAuthenticated, setLoading } = useAuthStore();

  return useQuery({
    queryKey: ['auth-check', isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) {
        return false;
      }

      setLoading(true);

      try {
        await authService.getProfile();
        return true;
      } catch {
        useAuthStore.getState().logout();
        return false;
      } finally {
        setLoading(false);
      }
    },
    staleTime: Infinity,
    retry: false,
  });
};
