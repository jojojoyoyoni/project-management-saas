import { apiClient } from '@/api/client'
import type { Project, PaginatedResponse, CreateProjectValues } from '@/types/project'

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
}

export const getProjects = async (orgId: string): Promise<PaginatedResponse<Project>> => {
  return apiClient(`/organizations/${orgId}/projects/`)
}

export const createProject = async (orgId: string, data: CreateProjectValues): Promise<Project> => {
  return apiClient(`/organizations/${orgId}/projects/`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
