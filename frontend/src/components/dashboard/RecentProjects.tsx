import type { Project } from '@/types/project'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

interface RecentProjectsProps {
  projects: Project[]
}

export default function RecentProjects({ projects }: RecentProjectsProps) {
  const navigate = useNavigate()

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Projects</h2>
        <button 
          onClick={() => navigate('/projects')}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          View all
        </button>
      </div>
      
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {projects.length === 0 ? (
          <li className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No projects found. Create one in Django Admin!
          </li>
        ) : (
          projects.slice(0, 5).map((project) => (
            <li key={project.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => navigate('/projects')}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {project.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                    {project.description || 'No description'}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </span>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
