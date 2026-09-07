import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/types/task'
import clsx from 'clsx'

interface TaskCardProps {
  task: Task
  onClick?: (taskId: string) => void
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(task.id) })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityColor: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    critical: 'bg-red-500 text-white dark:bg-red-600 dark:text-white',
  }

  const prioritySlug = task.priority?.slug || ''
  const priorityName = task.priority?.name || 'No Priority'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative',
        isDragging && 'opacity-50 shadow-lg rotate-2'
      )}
      {...attributes}
      // Put the click handler on the main div
      onClick={() => onClick?.(String(task.id))}
    >
      {/* Drag Handle Area - dnd-kit listeners go here */}
      <div 
        className="flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing" 
        {...listeners}
      >
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
          {task.key}
        </span>
        {/* You could put a drag icon here if you want */}
      </div>

      {/* Clickable Content Area */}
      <div className="flex items-start justify-between pointer-events-none">
        <p className="text-sm font-medium text-gray-900 dark:text-white flex-1">
          {task.title}
        </p>
        <span className={clsx(
          'text-xs font-medium px-2 py-0.5 rounded-full ml-2', 
          priorityColor[prioritySlug] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        )}>
          {priorityName}
        </span>
      </div>
      
      {task.due_date && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Due: {new Date(task.due_date).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}