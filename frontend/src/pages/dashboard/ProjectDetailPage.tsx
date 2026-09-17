import { useState } from 'react'
import { useParams } from 'react-router-dom'
import KanbanBoard from '@/components/tasks/KanbanBoard'
import ProjectTeamModal from '@/components/projects/ProjectTeamModal'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import { useSelector } from 'react-redux'
import { useOrganizations } from '@/api/hooks/useOrganizations'

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [activeTab, setActiveTab] = useState<'board' | 'team'>('board')
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  
//   // Get orgId from Redux (Adjust if your org slice is different)
//   const orgId = useSelector((state: any) => state.org?.activeOrgId || '1')
// //   const orgId = "8"
  // Get the real organizations from the API
  const { data: organizations = [] } = useOrganizations()
  
  // Get activeOrgId from Redux
  const reduxOrgId = useSelector((state: any) => state.org?.activeOrganizationId)
  
  // Find the actual active organization object
  const activeOrg = organizations.find((org) => org.id === reduxOrgId) || organizations[0]
  const orgId = activeOrg?.id

  if (!projectId) return <div>Project not found.</div>

  return (
    <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setActiveTab('board')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'board' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            📋 Board
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'team' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            👥 Team
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'board' && (
          <KanbanBoard projectId={projectId} />
        )}
        
        {activeTab === 'team' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Project Team</h2>
              <Button onClick={() => setIsTeamModalOpen(true)}>+ Invite Member</Button>
            </div>
            <ProjectTeamModal orgId={String(orgId)} projectId={projectId} onClose={() => setIsTeamModalOpen(false)} />
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="Invite New Member">
        {/* We will render just the invite form part here if we split it, but for now rendering the modal component is fine */}
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter a username or email to invite them to this project.</p>
          <ProjectTeamModal orgId={String(orgId)} projectId={projectId} onClose={() => setIsTeamModalOpen(false)} />
        </div>
      </Modal>

    </div>
  )
}