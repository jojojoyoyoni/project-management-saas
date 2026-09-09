import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys, getProjects, createProject, getProjectMembers,   inviteProjectMember, updateMemberRole, removeProjectMember  } from '@/api/queries/projectQueries'
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

export const useProjectMembers = (orgId: string | null, projectId: string | null) => {
  return useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => getProjectMembers(orgId!, projectId!),
    enabled: !!orgId && !!projectId,
  })
}


export const useInviteMember = (orgId: string, projectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { username_or_email: string; role: string }) => inviteProjectMember({ orgId, projectId, ...data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] })
  })
}

export const useUpdateMemberRole = (orgId: string, projectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { memberId: string; role: string }) => updateMemberRole({ orgId, projectId, memberId: data.memberId, role: data.role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] })
  })
}

export const useRemoveMember = (orgId: string, projectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => removeProjectMember({ orgId, projectId, memberId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] })
  })
}