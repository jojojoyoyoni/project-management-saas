import { apiClient } from '@/api/client'
import type { Task, PaginatedResponse } from '@/types/task'

export const taskKeys = {
  all: ['tasks'] as const,
  list: (projectId: string) => [...taskKeys.all, 'list', projectId] as const,
  detail: (projectId: string, taskId: string) => [...taskKeys.all, 'detail', projectId, taskId] as const,
}

export const getTasks = async (projectId: string): Promise<PaginatedResponse<Task>> => {
  return apiClient(`/projects/${projectId}/tasks/`)
}

export const getTaskDetails = async (projectId: string, taskId: string): Promise<Task> => {
  const res = await apiClient(`/projects/${projectId}/tasks/${taskId}/`)
  return res.task
}

export const updateTaskStatus = async ({ projectId, taskId, status }: { 
  projectId: string; taskId: string; status: string 
}): Promise<Task> => {
  return apiClient(`/projects/${projectId}/tasks/${taskId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export const updateTask = async ({ projectId, taskId, taskData }: { 
  projectId: string; taskId: string; taskData: any 
}): Promise<Task> => {
  const res = await apiClient(`/projects/${projectId}/tasks/${taskId}/`, {
    method: 'PATCH',
    body: JSON.stringify(taskData),
  })
  return res.task
}

export const createTask = async ({ projectId, taskData }: { 
  projectId: string; 
  taskData: any 
}): Promise<Task> => {
  return apiClient(`/projects/${projectId}/tasks/`, {
    method: 'POST',
    body: JSON.stringify(taskData),
  })
}

export const deleteTask = async ({ projectId, taskId }: { 
  projectId: string; taskId: string 
}) => {
  return apiClient(`/projects/${projectId}/tasks/${taskId}/`, {
    method: 'DELETE',
  })
}

export const getTaskActivities = async (projectId: string, taskId: string) => {
  const res = await apiClient(`/projects/${projectId}/tasks/${taskId}/activities/`)
  return res.activities // Django returns { success: true, activities: [...] }
}

export const getTaskComments = async (projectId: string, taskId: string) => {
  const res = await apiClient(`/projects/${projectId}/tasks/${taskId}/comments/`)
  return res // Assuming your view returns an array or paginated list
}

export const createTaskComment = async ({ projectId, taskId, content }: { 
  projectId: string; taskId: string; content: string 
}) => {
  const res = await apiClient(`/projects/${projectId}/tasks/${taskId}/comments/`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
  return res
}

export const getTaskStatuses = async (projectId: string) => {
  // Assuming your API endpoint is /api/tasks/statuses/?project=<id>
  const res = await apiClient(`/tasks/statuses/?project=${projectId}`)
  return res.results || res
}
