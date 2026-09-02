import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from '@/types/auth'
import { useLogin } from '@/api/hooks/useAuth'
import Input from '@/components/common/Input'

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = useLogin()

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Username"
        type="text"
        placeholder="johndoe"
        autoComplete="username"
        error={errors.username?.message}
        {...register('username')}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex items-center justify-end">
        <a
          href="/auth/forgot-password"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Forgot your password?
        </a>
      </div>

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
      </button>

      {loginMutation.isError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-300">
          {loginMutation.error.message || 'Invalid credentials. Please try again.'}
        </div>
      )}
    </form>
  )
}
