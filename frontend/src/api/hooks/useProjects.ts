import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys, getProjects, createProject } from '@/api/queries/projectQueries'
import { useAppSelector } from '@/store'
import type { CreateProjectValues } from '@/types/project'

export const useProjects = () => {
  const activeOrgId = useAppSelector((state) => state.org.activeOrganizationId)

  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: () => getProjects(activeOrgId!),
    enabled: !!activeOrgId, 
    retry: 1,
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()
  const activeOrgId = useAppSelector((state) => state.org.activeOrganizationId)

  return useMutation({
    mutationFn: (data: CreateProjectValues) => createProject(activeOrgId!, data),
    onSuccess: () => {
      // Automatically refresh the project list when a new one is created!
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    }
  })
}
