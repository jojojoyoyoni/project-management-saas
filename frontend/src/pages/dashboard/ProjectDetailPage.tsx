import { useState } from 'react'
import { useParams } from 'react-router-dom'
import KanbanBoard from '@/components/tasks/KanbanBoard'
import ProjectTeamModal from '@/components/projects/ProjectTeamModal'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import { useSelector } from 'react-redux'
import { useDeleteProject } from '@/api/hooks/useProjects'
import { FaTrash } from 'react-icons/fa6'

import { useOrganizations } from '@/api/hooks/useOrganizations'
import ProjectReport from '@/components/projects/ProjectReport'


export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [activeTab, setActiveTab] = useState<'board' | 'team' | 'settings' | 'reports'>('board')
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  
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

  const deleteProject = useDeleteProject()

  if (!projectId) return <div>Project not found.</div>

  const handleDelete = () => {
    deleteProject.mutate(projectId)
  }

  return (
    <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col">
      
      {/* Header & Tabs */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 flex-shrink-0">
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
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'reports' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            📊 Reports
          </button>
           {/* ADD SETTINGS TAB */}
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            ⚙️ Settings
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
            <ProjectTeamModal projectId={projectId} onClose={() => setIsTeamModalOpen(false)} />
          </div>
        )}
        {activeTab === 'reports' && (
          <div className="overflow-y-auto h-full pb-8">
            <ProjectReport projectId={projectId} />
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 h-full overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Project Settings</h2>
            
            {/* Danger Zone */}
            <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 bg-red-50/50 dark:bg-red-900/10">
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">Danger Zone</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Delete this project</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Once you delete a project, there is no going back. Please be certain.</p>
                </div>
                <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
                  <FaTrash className="mr-2" /> Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="Invite New Member">
        {/* We will render just the invite form part here if we split it, but for now rendering the modal component is fine */}
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter a username or email to invite them to this project.</p>
          <ProjectTeamModal projectId={projectId} onClose={() => setIsTeamModalOpen(false)} />
        </div>
      </Modal>

       {/* ADD SETTINGS CONTENT */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 h-full overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Project Settings</h2>
            
            {/* Danger Zone */}
            <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 bg-red-50/50 dark:bg-red-900/10">
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">Danger Zone</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Delete this project</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Once you delete a project, there is no going back. Please be certain.</p>
                </div>
                <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
                  <FaTrash className="mr-2" /> Archieve
                </Button>
              </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Project">
              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                   Are you sure you want to archive this project? It will be hidden from the dashboard, but no tasks or data will be permanently deleted.
                </p>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                  <Button variant="danger" onClick={handleDelete} isLoading={deleteProject.isPending}>
                    Yes, Archive project
                  </Button>
                </div>
              </div>
            </Modal>
            </div>
    )}
    </div>
  )
}
