import { apiClient } from '@/api/client'
import type { Organization } from '@/types/organization'

export const orgKeys = {
  all: ['organizations'] as const,
  list: () => [...orgKeys.all, 'list'] as const,
}

export const getOrganizations = async (): Promise<Organization[]> => {
  // Your backend wraps lists in standard DRF pagination
  const response = await apiClient('/organizations/')
  return response.results || response // Handle both array and paginated response
}

export const createOrganization = async (data: FormData) => {
  const res = await apiClient('/organizations/', {
    method: 'POST',
    body: data,
  })
  return res
}

// Add update function
export const updateOrganization = async ({ orgId, data }: { orgId: string, data: FormData }) => {
  const res = await apiClient(`/organizations/${orgId}/`, {
    method: 'PATCH',
    body: data,
  })
  return res
}

export const getOrgDashboard = async (orgId: string) => {
  return apiClient(`/organizations/${orgId}/dashboard/`)
}