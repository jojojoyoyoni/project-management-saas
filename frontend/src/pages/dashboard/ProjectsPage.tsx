import { useState } from 'react'
import { useProjects } from '@/api/hooks/useProjects'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import ProjectList from '@/components/projects/ProjectList'
import CreateProjectModal from '@/components/projects/CreateProjectModal'
import CreateOrganizationModal from '@/components/organizations/CreateOrganizationModal'
import Modal from '@/components/common/Modal'
import Spinner from '@/components/common/Spinner'

export default function ProjectsPage() {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  
  // Fetch both projects and organizations
  const { data: projectsData, isLoading: projectsLoading } = useProjects()
  const { data: organizations = [], isLoading: orgsLoading } = useOrganizations()

  const projects = projectsData?.results || []

  // Loading state
  if (projectsLoading || orgsLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  // ONBOARDING STATE: If user has no organizations
  if (organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-15rem)] text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-6">
          🚀
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to ProjectFlow!</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">
          You need to create a workspace (organization) before you can start managing projects.
        </p>
        
        {/* Inline Org Creation Modal Trigger */}
        <InlineOrgCreator />
      </div>
    )
  }

  // NORMAL STATE: User has organizations, show projects
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage and view all your organization's projects.
          </p>
        </div>
        <button 
          onClick={() => setIsProjectModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-lg font-medium">No projects found</p>
          <p className="text-sm mt-1">Create your first project to get started.</p>
        </div>
      ) : (
        <ProjectList projects={projects} />
      )}

      <CreateProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} />
    </div>
  )
}

// Small helper component to open the org modal
function InlineOrgCreator() {
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(true)
  return (
    <div className="mt-6">
      <button 
        onClick={() => setIsOrgModalOpen(true)}
        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Create Your First Workspace
      </button>

      <Modal isOpen={isOrgModalOpen} onClose={() => setIsOrgModalOpen(false)} title="Create New Organization">
        <CreateOrganizationModal onClose={() => setIsOrgModalOpen(false)} />
      </Modal>
    </div>
  )
}