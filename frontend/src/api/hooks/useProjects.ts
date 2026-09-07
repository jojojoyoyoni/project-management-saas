import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys, getProjects, createProject, getProjectMembers } from '@/api/queries/projectQueries'
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


// Add this hook
// export const useProjectMembers = (projectId: string | null) => {
//   return useQuery({
//     queryKey: ['projectMembers', projectId],
//     queryFn: () => getProjectMembers(projectId!),
//     enabled: !!projectId,
//   })
// }

export const useProjectMembers = (orgId: string | null, projectId: string | null) => {
  return useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => getProjectMembers(orgId!, projectId!),
    enabled: !!orgId && !!projectId,
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
