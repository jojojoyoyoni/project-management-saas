import { useState } from 'react'
import { useProjects } from '@/api/hooks/useProjects'
import KanbanBoard from '@/components/tasks/KanbanBoard'
import Spinner from '@/components/common/Spinner'

export default function TasksPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const { data, isLoading } = useProjects()
  
  const projects = data?.results || []

  return (
    <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Board</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Drag and drop tasks to update their status.
          </p>
        </div>
        
        {/* Project Selector */}
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          disabled={isLoading || projects.length === 0}
        >
          <option value="">Select a Project...</option>
          {projects.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.key} - {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : selectedProjectId ? (
          <KanbanBoard projectId={selectedProjectId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            {projects.length === 0 ? "You don't have any projects yet." : "Please select a project to view tasks."}
          </div>
        )}
      </div>
    </div>
  )
}