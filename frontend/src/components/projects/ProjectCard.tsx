import type { Project } from '@/types/project'
import { FaFolderOpen } from 'react-icons/fa6'

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
          <FaFolderOpen className="h-6 w-6" />
        </div>
      </div>
      
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white truncate">
        {project.name}
      </h3>
      
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[2.5rem]">
        {project.description || 'No description provided.'}
      </p>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Owner: {project.owner}</span>
        <span>{new Date(project.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
