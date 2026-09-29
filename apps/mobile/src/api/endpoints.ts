import type {
  AccountResponse,
  CatalogueResponse,
  ProfileFormInput,
  RegisterResponse,
  ResendCodeResponse,
  SelectedTasksResponse,
  SessionResponse,
} from '@padosipro/shared';
import { request } from './client';

export const api = {
  register: (email: string, password: string) =>
    request<RegisterResponse>('/api/auth/register', { method: 'POST', body: { email, password } }),

  verifyEmail: (email: string, code: string) =>
    request<SessionResponse>('/api/auth/verify-email', { method: 'POST', body: { email, code } }),

  resendCode: (email: string) => request<ResendCodeResponse>('/api/auth/resend-code', { method: 'POST', body: { email } }),

  login: (email: string, password: string) =>
    request<SessionResponse>('/api/auth/login', { method: 'POST', body: { email, password } }),

  logout: () => request<void>('/api/auth/logout', { method: 'POST', body: {} }),

  me: () => request<AccountResponse>('/api/me'),

  saveProfile: (profile: ProfileFormInput) => request<AccountResponse>('/api/me/profile', { method: 'PUT', body: profile }),

  catalogue: () => request<CatalogueResponse>('/api/tasks'),

  selectedTasks: () => request<SelectedTasksResponse>('/api/me/tasks'),

  saveTasks: (taskIds: string[]) => request<SelectedTasksResponse>('/api/me/tasks', { method: 'PUT', body: { taskIds } }),

  health: (baseUrl: string) => request<{ status: string }>('/health', { baseUrl }),
};

export const queryKeys = {
  catalogue: ['catalogue'] as const,
  selectedTasks: ['me', 'tasks'] as const,
};
