import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { orgKeys, getOrganizations, createOrganization, updateOrganization, getOrgDashboard } from '@/api/queries/organizationQueries'
import { setActiveOrganization } from '@/store/slices/orgSlice'

export const useOrganizations = () => {
  return useQuery({
    queryKey: orgKeys.list(),
    queryFn: getOrganizations,
    retry: 1,
  })
}

export const useCreateOrganization = () => {
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: FormData) => createOrganization(data),
    onSuccess: (data) => {
      // 1. Set the new org as the active org in Redux
      dispatch(setActiveOrganization(data.organization.id))
      
      // 2. Refetch the organizations list for the sidebar
      queryClient.invalidateQueries({ queryKey: orgKeys.list() })
      
      // 3. Clear any cached projects so it loads fresh for the new org
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      
      // 4. Redirect the user to the projects page instantly
      navigate('/projects')
    },
  })
}

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string, data: FormData }) => {
      return updateOrganization({ orgId, data })
    },
    onSuccess: () => {
      // Refresh the organizations list so the sidebar updates with the new name/logo
      queryClient.invalidateQueries({ queryKey: orgKeys.list() })
    },
  })
}


export const useOrgDashboard = (orgId: string | null) => {
  return useQuery({
    queryKey: ['orgDashboard', orgId],
    queryFn: () => getOrgDashboard(orgId!),
    enabled: !!orgId,
  })
}