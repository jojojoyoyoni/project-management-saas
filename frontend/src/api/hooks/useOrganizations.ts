import { useQuery } from '@tanstack/react-query'
import { orgKeys, getOrganizations } from '@/api/queries/organizationQueries'

export const useOrganizations = () => {
  return useQuery({
    queryKey: orgKeys.list(),
    queryFn: getOrganizations,
    // Don't fetch if not logged in (handled by router, but good practice)
    retry: 1,
  })
}
