import { useState } from 'react'
import { useProjectMembers, useInviteMember, useUpdateMemberRole, useRemoveMember } from '@/api/hooks/useProjects'
import Button from '@/components/common/Button'
import Spinner from '@/components/common/Spinner'

interface ProjectTeamModalProps {
  orgId: string
  projectId: string
  onClose: () => void
}

export default function ProjectTeamModal({ orgId, projectId, onClose }: ProjectTeamModalProps) {
  const { data: members, isLoading } = useProjectMembers(orgId, projectId)
  const inviteMember = useInviteMember(orgId, projectId)
  const updateRole = useUpdateMemberRole(orgId, projectId)
  const removeMember = useRemoveMember(orgId, projectId)

  const [search, setSearch] = useState('')
  const [role, setRole] = useState('viewer')

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    inviteMember.mutate({ username_or_email: search, role })
    setSearch('')
  }

  return (
    <div className="space-y-6">
      {/* Invite Section */}
      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Invite New Member</h3>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter username or email..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit" isLoading={inviteMember.isPending}>Invite</Button>
        </form>
        {inviteMember.isError && <p className="text-red-500 text-xs mt-2">{inviteMember.error.message}</p>}
      </div>

      {/* Members List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Team Members</h3>
        {isLoading ? <Spinner /> : (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {members?.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {m.user.first_name ? `${m.user.first_name} ${m.user.last_name}` : m.user.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{m.user.email}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {m.role === 'owner' ? (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">Owner</span>
                  ) : (
                    <>
                      <select
                        value={m.role}
                        onChange={(e) => updateRole.mutate({ memberId: m.id, role: e.target.value })}
                        className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button 
                        onClick={() => removeMember.mutate(m.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Remove Member"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}