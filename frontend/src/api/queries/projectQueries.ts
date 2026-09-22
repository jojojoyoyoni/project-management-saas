import { apiClient } from '@/api/client'
import type { Project, PaginatedResponse, CreateProjectValues } from '@/types/project'

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
}

export const getProjects = async (): Promise<PaginatedResponse<Project>> => {
  return apiClient('/projects/')
}

export const createProject = async (orgId: string, data: CreateProjectValues): Promise<Project> => {
  // Send orgId inside the JSON body as 'organization'
  return apiClient(`/projects/`, {
    method: 'POST',
    body: JSON.stringify({ ...data, organization: orgId }),
  })
}

// Removed orgId parameter
export const getProjectMembers = async (projectId: string) => {
  try {
    const res = await apiClient(`/projects/${projectId}/members/`)
    // Backend returns { success, members: [...] }, so we extract it safely
    return res.members || res.results || res
  } catch (error) {
    return []
  }
}

// Removed orgId parameter
export const inviteProjectMember = async ({ projectId, username_or_email, role }: { 
  projectId: string; username_or_email: string; role: string 
}) => {
  return apiClient(`/projects/${projectId}/invite_member/`, {
    method: 'POST',
    body: JSON.stringify({ username_or_email, role }),
  })
}

// Removed orgId parameter
export const updateMemberRole = async ({ projectId, memberId, role }: { 
  projectId: string; memberId: string; role: string 
}) => {
  return apiClient(`/projects/${projectId}/update_member_role/`, {
    method: 'PATCH',
    body: JSON.stringify({ member_id: memberId, role }),
  })
}

// Removed orgId parameter
export const removeProjectMember = async ({ projectId, memberId }: { 
  projectId: string; memberId: string 
}) => {
  return apiClient(`/projects/${projectId}/remove_member/`, {
    method: 'DELETE',
    body: JSON.stringify({ member_id: memberId }),
  })
}

export const deleteProject = async (projectId: string) => {
  return apiClient(`/projects/${projectId}/`, {
    method: 'DELETE',
  })
}

export const getProjectReport = async (projectId: string) => {
  return apiClient(`/projects/${projectId}/report/`)
}