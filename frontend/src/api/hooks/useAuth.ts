import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { loginUser, authKeys, getCurrentUser, updateUserProfile } from '@/api/queries/authQueries'
import { useAppDispatch } from '@/store'
import { setCredentials } from '@/store/slices/authSlice'
import type { LoginFormValues } from '@/types/auth'


export const useLogin = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginFormValues) => loginUser(data),
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access)
      queryClient.fetchQuery({ queryKey: authKeys.user(), queryFn: getCurrentUser })
        .then((user) => {
          dispatch(setCredentials({ user, token: data.access }))
          navigate('/')
        })
    },
    onError: (error) => {
      console.error('Login failed:', error.message)
    },
  })
}

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    // Only fetch if we have a token in localStorage
    enabled: !!localStorage.getItem('access_token'),
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userData: { first_name?: string; last_name?: string; avatar?: string }) => {
      return updateUserProfile(userData)
    },
    onSuccess: () => {
      // Invalidate the current user query so the header/sidebar updates with new name/avatar
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    }
  })
}