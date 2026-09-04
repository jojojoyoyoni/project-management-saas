import { z } from 'zod'

// Zod schema for creating a project
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  key: z.string().min(1, 'Project key is required').max(10, 'Max 10 characters').toUpperCase(),
  description: z.string().optional(),
})

export type CreateProjectValues = z.infer<typeof createProjectSchema>

export interface Project {
  id: string
  name: string
  description: string
  key: string
  status: 'active' | 'archived' | 'on_hold'
  priority: 'low' | 'medium' | 'high' | 'critical'
  organization: string
  active_tasks: number;       // <-- ADD THIS
  completed_tasks: number;  
  created_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: null
  results: T[]
}
