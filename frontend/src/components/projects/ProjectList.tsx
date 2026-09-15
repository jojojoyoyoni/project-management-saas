import { Link } from 'react-router-dom'
import ProjectCard from './ProjectCard'
import type { Project } from '@/types/project'

// Add the props interface
interface ProjectListProps {
  projects: Project[]
}

export default function ProjectList({ projects }: ProjectListProps) {
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
        <Link to={`/projects/${project.id}`} key={project.id}>
          <ProjectCard project={project} />
        </Link>
      ))}
    </div>
  )
}