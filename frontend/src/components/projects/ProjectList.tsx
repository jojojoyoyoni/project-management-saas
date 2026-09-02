import { useProjects } from '@/api/hooks/useProjects'
import ProjectCard from './ProjectCard'
import Spinner from '@/components/common/Spinner'

export default function ProjectList() {
  const { data, isLoading, isError, error } = useProjects()

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  if (isError) {
    return (
      <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400 font-medium">Failed to load projects</p>
        <p className="text-sm text-red-500 dark:text-red-300 mt-1">
          {error.message || 'Is your Django backend running on port 8000?'}
        </p>
      </div>
    )
  }

  const projects = data?.results || []

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium">No projects found</p>
        <p className="text-sm mt-1">Create your first project to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
