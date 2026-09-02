import { apiClient } from '@/api/client'
import type { AuthTokens, User, LoginFormValues } from '@/types/auth'

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
}

export const loginUser = async (data: LoginFormValues): Promise<AuthTokens> => {
  return apiClient('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const getCurrentUser = async (): Promise<User> => {
  return apiClient('/auth/me/')
}
