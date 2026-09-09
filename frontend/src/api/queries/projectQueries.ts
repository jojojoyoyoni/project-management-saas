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

export const getProjectMembers = async (orgId: string, projectId: string) => {
  try {
    const res = await apiClient(`/organizations/${orgId}/projects/${projectId}/members/`)
    return res.results || res
  } catch (error) {
    // If it fails, return empty array so the dropdown doesn't crash
    return []
  }
}


export const inviteProjectMember = async ({ orgId, projectId, username_or_email, role }: { 
  orgId: string; projectId: string; username_or_email: string; role: string 
}) => {
  return apiClient(`/organizations/${orgId}/projects/${projectId}/invite_member/`, {
    method: 'POST',
    body: JSON.stringify({ username_or_email, role }),
  })
}

export const updateMemberRole = async ({ orgId, projectId, memberId, role }: { 
  orgId: string; projectId: string; memberId: string; role: string 
}) => {
  return apiClient(`/organizations/${orgId}/projects/${projectId}/update_member_role/`, {
    method: 'PATCH',
    body: JSON.stringify({ member_id: memberId, role }),
  })
}

export const removeProjectMember = async ({ orgId, projectId, memberId }: { 
  orgId: string; projectId: string; memberId: string 
}) => {
  return apiClient(`/organizations/${orgId}/projects/${projectId}/remove_member/`, {
    method: 'DELETE',
    body: JSON.stringify({ member_id: memberId }),
  })
}