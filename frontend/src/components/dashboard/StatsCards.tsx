import type { Project } from '@/types/project'
import { FaFolderOpen, FaListCheck, FaCircleCheck, FaTriangleExclamation } from 'react-icons/fa6'

interface StatsCardsProps {
  projects: Project[]
}

export default function StatsCards({ projects }: StatsCardsProps) {
  const stats = [
    { name: 'Total Projects', value: projects.length, icon: FaFolderOpen, color: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
    { name: 'Active Tasks', value: '-', icon: FaListCheck, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { name: 'Completed', value: '-', icon: FaCircleCheck, color: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
    { name: 'Overdue', value: '0', icon: FaTriangleExclamation, color: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="ml-4 w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
