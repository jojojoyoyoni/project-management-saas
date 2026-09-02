import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { loginUser, authKeys, getCurrentUser } from '@/api/queries/authQueries'
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
    queryKey: authKeys.user(),
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
}
