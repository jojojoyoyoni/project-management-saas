import { apiClient } from '@/api/client'
import type { Task, PaginatedResponse } from '@/types/task'

export const taskKeys = {
  all: ['tasks'] as const,
  list: (projectId: string) => [...taskKeys.all, 'list', projectId] as const,
}

// Fixed to match Django URL: /api/projects/<id>/tasks/
export const getTasks = async (projectId: string): Promise<PaginatedResponse<Task>> => {
  return apiClient(`/projects/${projectId}/tasks/`)
}

export const updateTaskStatus = async ({ projectId, taskId, status }: { 
  projectId: string; taskId: string; status: string 
}): Promise<Task> => {
  return apiClient(`/projects/${projectId}/tasks/${taskId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
// ADD THIS: Create Task API function
export const createTask = async ({ projectId, taskData }: { 
  projectId: string; 
  taskData: any 
}): Promise<Task> => {
  return apiClient(`/projects/${projectId}/tasks/`, {
    method: 'POST',
    body: JSON.stringify(taskData),
  })
}
