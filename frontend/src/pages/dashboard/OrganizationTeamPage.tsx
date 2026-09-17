import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { useAppSelector } from '@/store'
import Spinner from '@/components/common/Spinner'
import Button from '@/components/common/Button'
import { FaUserPlus, FaTrash, FaUserShield } from 'react-icons/fa6'

// 1. API Functions matched exactly to your Django Backend
const getOrgMembers = async (orgId: string) => {
  const res = await apiClient(`/organizations/${orgId}/members/`)
  return res.members // Backend returns { success, members: [...] }
}

const inviteOrgMember = async ({ orgId, data }: { orgId: string, data: any }) => {
  const res = await apiClient(`/organizations/${orgId}/invite/`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res
}

const removeOrgMember = async ({ orgId, userId }: { orgId: string, userId: string }) => {
  return apiClient(`/organizations/${orgId}/remove_member/`, {
    method: 'POST', // Backend expects POST, not DELETE
    body: JSON.stringify({ user_id: userId }),
  })
}

export default function OrganizationTeamPage() {
  const queryClient = useQueryClient()
  const activeOrgId = useAppSelector((state: any) => state.org?.activeOrganizationId)
  
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('member')

  const { data: members, isLoading } = useQuery({
    queryKey: ['orgMembers', activeOrgId],
    queryFn: () => getOrgMembers(activeOrgId),
    enabled: !!activeOrgId,
  })

  const inviteMutation = useMutation({
    mutationFn: (data: any) => inviteOrgMember({ orgId: activeOrgId, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgMembers', activeOrgId] })
      setSearch('')
    }
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeOrgMember({ orgId: activeOrgId, userId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orgMembers', activeOrgId] })
  })

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    // Backend InviteMemberSerializer likely expects 'email' or 'username_or_email'
    // inviteMutation.mutate({ username_or_email: search, role })
     // FIX: Change 'username_or_email' to 'email' to match Django backend
    inviteMutation.mutate({ email: search, role })
  }

  if (!activeOrgId) return <div className="text-center py-12">Please select an organization.</div>
  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <FaUserShield className="text-indigo-600 text-3xl" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Team</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Invite users and manage their roles within this organization.</p>
        </div>
      </div>

      {/* Invite Card */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Invite New Member</h3>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter username or email..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="guest">Guest</option>
          </select>
          <Button type="submit" isLoading={inviteMutation.isPending}>
            <FaUserPlus className="mr-2" /> Invite
          </Button>
        </form>
        {inviteMutation.isError && (
          <p className="text-red-500 text-xs mt-2">{inviteMutation.error.message}</p>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Team Members ({members?.length || 0})</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {members?.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold">
                  {m.user?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {m.user?.first_name ? `${m.user.first_name} ${m.user.last_name}` : m.user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{m.user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                  m.role === 'owner' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                  m.role === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {m.role}
                </span>
                
                {/* Backend remove_member expects user_id, not member_id */}
                {m.role !== 'owner' && (
                  <button 
                    onClick={() => removeMutation.mutate(m.user.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove Member"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}