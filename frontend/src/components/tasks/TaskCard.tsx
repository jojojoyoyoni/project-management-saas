import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/types/task'
import clsx from 'clsx'

interface TaskCardProps {
  task: Task
}

export default function TaskCard({ task }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityColor = {
    LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow',
        isDragging && 'opacity-50 shadow-lg rotate-2'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-900 dark:text-white flex-1">
          {task.title}
        </p>
        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full ml-2', priorityColor[task.priority])}>
          {task.priority}
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
