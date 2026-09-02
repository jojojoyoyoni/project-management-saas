import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Task } from '@/types/task'
import TaskCard from './TaskCard'

interface KanbanColumnProps {
  title: string
  tasks: Task[]
}

export default function KanbanColumn({ title, tasks }: KanbanColumnProps) {
  return (
    <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4 w-80 flex-shrink-0 flex flex-col max-h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          {title}
        </h3>
        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 min-h-[100px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No tasks</p>
        )}
      </div>
    </div>
  )
}
