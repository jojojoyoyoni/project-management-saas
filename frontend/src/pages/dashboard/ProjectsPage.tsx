import { useState } from 'react'
import { useProjects } from '@/api/hooks/useProjects'
import ProjectList from '@/components/projects/ProjectList'
import CreateProjectModal from '@/components/projects/CreateProjectModal'
import Spinner from '@/components/common/Spinner'

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data, isLoading, isError } = useProjects()

  const projects = data?.results || []

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
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Project
        </button>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner /></div>}
      {isError && <div className="text-center py-12 text-red-500">Failed to load projects.</div>}
      {!isLoading && !isError && <ProjectList projects={projects} />}

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
