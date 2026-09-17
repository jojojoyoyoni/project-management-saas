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

export const getCurrentUser = async () => {
  const res = await apiClient('/auth/me/')
  return res.user
}

export const getAllUsers = async () => {
  const res = await apiClient('/auth/users/')
  
  // Handle paginated response { count: 7, results: [...] }
  if (res.results) return res.results
  
  // Handle flat array response [ {...}, {...} ]
  if (Array.isArray(res)) return res
  
  return []
}

export const updateUserProfile = async (userData: { first_name?: string; last_name?: string; avatar?: string }) => {
  const res = await apiClient('/auth/me/', {
    method: 'PATCH',
    body: JSON.stringify(userData),
  })
  return res.user
}

export const changePassword = async (passwordData: { 
  old_password: string; 
  new_password: string; 
  new_password_confirm: string 
}) => {
  return apiClient('/auth/me/password/', {
    method: 'POST',
    body: JSON.stringify(passwordData),
  })
}

export const registerUser = async (userData: { 
  username: string; 
  email: string; 
  first_name: string;
  last_name: string;
  password: string; 
  password_confirm: string 
  token?: string;

}) => {
  const res = await apiClient('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
  return res
}

export const logoutUser = async () => {
  const refreshToken = localStorage.getItem('refresh_token')
  return apiClient('/auth/logout/', {
    method: 'POST',
    body: JSON.stringify({ refresh: refreshToken }),
  })
}