import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  projectKeys, 
  getProjects, 
  createProject, 
  getProjectMembers, 
  inviteProjectMember, 
  updateMemberRole, 
  removeProjectMember 
} from '@/api/queries/projectQueries'
import { useAppSelector } from '@/store'
import type { CreateProjectValues } from '@/types/project'

export const useProjects = () => {
  return useQuery({
    queryKey: projectKeys.lists(),
    // getProjects() no longer needs orgId because the URL is just /api/projects/
    queryFn: () => getProjects(), 
    retry: 1,
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()
  const activeOrgId = useAppSelector((state) => state.org.activeOrganizationId)

  return useMutation({
    // We still pass activeOrgId here so the backend knows which org to attach the project to
    mutationFn: (data: CreateProjectValues) => createProject(activeOrgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    }
  })
}

// Removed orgId parameter
export const useProjectMembers = (projectId: string | null) => {
  return useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => getProjectMembers(projectId!),
    enabled: !!projectId,
  })
}

// Removed orgId parameter
export const useInviteMember = (projectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { username_or_email: string; role: string }) => 
      inviteProjectMember({ projectId, ...data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] })
  })
}

// Removed orgId parameter
export const useUpdateMemberRole = (projectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { memberId: string; role: string }) => 
      updateMemberRole({ projectId, memberId: data.memberId, role: data.role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] })
  })
}

// Removed orgId parameter
export const useRemoveMember = (projectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => removeProjectMember({ projectId, memberId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] })
  })
}