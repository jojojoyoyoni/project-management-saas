import type { Task, PaginatedResponse } from '@/types/task'

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
}

// TEMPORARY MOCK DATA SO YOU CAN SEE THE DRAG AND DROP WORKING
// Later, you will change this to hit your real Django endpoint:
// return apiClient(`/projects/${projectId}/tasks/`)
export const getTasks = async (): Promise<PaginatedResponse<Task>> => {
  await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
  
  return {
    count: 5,
    next: null,
    previous: null,
    results: [
      { id: '1', title: 'Setup Postgres Database', description: '', status: 'DONE', priority: 'HIGH', project: '1', assignee: '1', due_date: '2024-10-01' },
      { id: '2', title: 'Build DRF Serializers', description: '', status: 'IN_PROGRESS', priority: 'HIGH', project: '1', assignee: '1', due_date: null },
      { id: '3', title: 'Write API Documentation', description: '', status: 'TODO', priority: 'LOW', project: '1', assignee: '2', due_date: '2024-10-15' },
      { id: '4', title: 'Implement JWT Authentication', description: '', status: 'IN_PROGRESS', priority: 'MEDIUM', project: '1', assignee: '1', due_date: null },
      { id: '5', title: 'Design Kanban Board UI', description: '', status: 'TODO', priority: 'MEDIUM', project: '1', assignee: '1', due_date: null },
    ]
  }
}

// Kept for when you connect the real backend
export const updateTaskStatus = async ({ id, status }: { id: string; status: string }): Promise<Task> => {
  console.log(`Would have sent PATCH to /api/projects/1/tasks/${id}/ with status: ${status}`)
  return { id, title: '', description: '', status: status as any, priority: 'LOW', project: '1', assignee: null, due_date: null }
}
