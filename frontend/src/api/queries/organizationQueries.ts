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
