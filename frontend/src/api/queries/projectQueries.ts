import { apiClient } from '@/api/client'
import type { Project, PaginatedResponse } from '@/types/project'

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
}

// Now uses the dynamic org ID passed from the hook
export const getProjects = async (orgId: string): Promise<PaginatedResponse<Project>> => {
  return apiClient(`/organizations/${orgId}/projects/`)
}
