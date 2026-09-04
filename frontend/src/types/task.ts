// frontend/src/types/task.ts
export type TaskStatus = 'to-do' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface TaskStatusObject {
  id: number
  name: string
  slug: TaskStatus
  color: string
  order: number
  is_default?: boolean
}

export interface TaskPriorityObject {
  id: number
  name: string
  slug: TaskPriority
  color: string
  order: number
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatusObject
  priority: TaskPriorityObject
  project: string
  assignee: string | null
  due_date: string | null
  task_number?: number
  key?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: null
  results: T[]
}