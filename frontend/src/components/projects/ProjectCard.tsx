import type { Project } from '@/types/project'
import { FaFolderOpen } from 'react-icons/fa6'

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer group h-full flex flex-col">
      <div className="flex items-start justify-between">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
          <FaFolderOpen className="h-6 w-6" />
        </div>
        <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md">
          {project.key}
        </span>
      </div>
      
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white truncate">
        {project.name}
      </h3>
      
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[2.5rem] flex-1">
        {project.description || 'No description provided.'}
      </p>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{project.task_count || 0} Tasks</span>
        <span>0 Members</span>
      </div>
    </div>
  )
}