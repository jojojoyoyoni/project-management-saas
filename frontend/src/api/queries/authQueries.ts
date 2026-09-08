import { apiClient } from '@/api/client'
import type { AuthTokens, User, LoginFormValues } from '@/types/auth'

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
}

// Use your original loginUser function with the types
export const loginUser = async (data: LoginFormValues): Promise<AuthTokens> => {
  return apiClient('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const getCurrentUser = async () => {
  const res = await apiClient('/auth/me/')
  return res.user
}

export const updateUserProfile = async (userData: { first_name?: string; last_name?: string; avatar?: string }) => {
  const res = await apiClient('/auth/me/', {
    method: 'PATCH',
    body: JSON.stringify(userData),
  })
  return res.user
}

export const registerUser = async (userData: { 
  username: string; 
  email: string; 
  first_name: string;
  last_name: string;
  password: string; 
  password_confirm: string 
}) => {
  const res = await apiClient('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(userData), // Now it sends ALL the fields!
  })
  return res
}

export const logoutUser = async () => {
  // We need to send the refresh token to Django so it can blacklist it
  const refreshToken = localStorage.getItem('refresh_token')
  return apiClient('/auth/logout/', {
    method: 'POST',
    body: JSON.stringify({ refresh: refreshToken }),
  })
}