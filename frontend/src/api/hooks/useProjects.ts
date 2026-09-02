import { useQuery } from '@tanstack/react-query'
import { projectKeys, getProjects } from '@/api/queries/projectQueries'
import { useAppSelector } from '@/store'

export const useProjects = () => {
  const activeOrgId = useAppSelector((state) => state.org.activeOrganizationId)

  return useQuery({
    queryKey: projectKeys.lists(),
    // Disable query if no organization is selected
    queryFn: () => getProjects(activeOrgId!),
    enabled: !!activeOrgId, 
    retry: 1,
  })
}
