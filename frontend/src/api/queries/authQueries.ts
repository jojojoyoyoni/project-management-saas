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


// export const getCurrentUser = async () => {
//   const res = await apiClient('/users/me/')
//   return res.user // <-- Extract the user object here
// }

// export const updateUserProfile = async (userData: { first_name?: string; last_name?: string; avatar?: string }) => {
//   // Assuming your backend has a /api/users/me/ endpoint for the current user
//   const res = await apiClient('/users/me/', {
//     method: 'PATCH',
//     body: JSON.stringify(userData),
//   })
//   return res
// }


export const getCurrentUser = async () => {
  // Change the URL to /auth/me/
  const res = await apiClient('/auth/me/')
  return res.user // Extract the user object from { success: true, user: {...} }
}

export const updateUserProfile = async (userData: { first_name?: string; last_name?: string; avatar?: string }) => {
  // Change the URL to /auth/me/
  const res = await apiClient('/auth/me/', {
    method: 'PATCH',
    body: JSON.stringify(userData),
  })
  return res.user
}