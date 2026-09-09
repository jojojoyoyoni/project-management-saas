import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useChangePassword } from '@/api/hooks/useAuth'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'

const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  new_password_confirm: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.new_password === data.new_password_confirm, {
  message: "Passwords don't match",
  path: ["new_password_confirm"],
})

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export default function ChangePasswordForm() {
  const [successMessage, setSuccessMessage] = useState('')
  const changePasswordMutation = useChangePassword()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = (data: ChangePasswordFormValues) => {
    setSuccessMessage('')
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        setSuccessMessage('Password updated successfully!')
        reset() // Clear the form fields
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Current Password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        error={errors.old_password?.message}
        {...register('old_password')}
      />

      <Input
        label="New Password"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        error={errors.new_password?.message}
        {...register('new_password')}
      />

      <Input
        label="Confirm New Password"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        error={errors.new_password_confirm?.message}
        {...register('new_password_confirm')}
      />

      {changePasswordMutation.isError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-300">
          {changePasswordMutation.error.message || 'Failed to change password. Check your current password.'}
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-3 text-sm text-green-700 dark:text-green-300">
          {successMessage}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" isLoading={changePasswordMutation.isPending}>
          Update Password
        </Button>
      </div>
    </form>
  )
}