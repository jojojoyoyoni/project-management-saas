import KanbanBoard from '@/components/tasks/KanbanBoard'

export default function TasksPage() {
  return (
    <div className="space-y-6 h-[calc(100vh-10rem)]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Board</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Drag and drop tasks to update their status.
        </p>
      </div>

      <KanbanBoard />
    </div>
  )
}
