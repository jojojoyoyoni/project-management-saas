import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerUser, authKeys, getCurrentUser, updateUserProfile, logoutUser } from '@/api/queries/authQueries'
import { useAppDispatch } from '@/store'
import { setCredentials } from '@/store/slices/authSlice'
import type { LoginFormValues } from '@/types/auth'
import { logout } from '@/store/slices/authSlice' // Add to imports at top



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

export const useLogout = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => logoutUser(),
    onSuccess: () => {
      // 1. Remove tokens from localStorage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      
      // 2. Clear Redux store
      dispatch(logout())
      
      // 3. Clear React Query cache so no old data is shown
      queryClient.clear()
      
      // 4. Redirect to login page
      navigate('/auth/login')
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

// ADD THIS HOOK FOR REGISTRATION:
export const useRegister = () => {
  const navigate = useNavigate()

  return useMutation({
    // Change this type to match the new form values
    mutationFn: (data: { 
      username: string; 
      email: string; 
      first_name: string;
      last_name: string;
      password: string; 
      password_confirm: string; 
    }) => registerUser(data),
    onSuccess: () => {
      // After successful registration, redirect them to the login page
      navigate('/auth/login')
    },
    onError: (error) => {
      console.error('Registration failed:', error.message)
    },
  })
}

