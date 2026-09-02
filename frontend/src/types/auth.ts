import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
}

export interface AuthTokens {
  access: string
  refresh: string
}
