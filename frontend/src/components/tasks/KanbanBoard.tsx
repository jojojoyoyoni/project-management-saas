import { useState, useEffect } from 'react'
import { DndContext, closestCorners, type DragEndEvent } from '@dnd-kit/core'
import { useTasks, useUpdateTaskStatus } from '@/api/hooks/useTasks'
import KanbanColumn from './KanbanColumn'
import Spinner from '@/components/common/Spinner'
import type { Task, TaskStatus } from '@/types/task'

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'DONE', title: 'Done' },
]

export default function KanbanBoard() {
  const { data, isLoading, isError } = useTasks()
  const updateStatus = useUpdateTaskStatus()
  
  // Local state to manage drag-and-drop visuals instantly
  const [localTasks, setLocalTasks] = useState<Record<TaskStatus, Task[]>>({
    TODO: [], IN_PROGRESS: [], DONE: []
  })

  // Sync React Query data to local state
  useEffect(() => {
    if (data?.results) {
      const grouped: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], DONE: [] }
      data.results.forEach(task => {
        if (grouped[task.status]) {
          grouped[task.status].push(task)
        }
      })
      setLocalTasks(grouped)
    }
  }, [data])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    let targetColumn: TaskStatus | null = null

    // Find which column the task was dropped into
    for (const col of COLUMNS) {
      if (localTasks[col.id].some(t => t.id === taskId) || col.id === over.id) {
        // If dropped directly on a column header
        if (col.id === over.id && !localTasks[col.id].some(t => t.id === taskId)) {
          targetColumn = col.id
          break
        }
        // If dropped on another task within a column
        if (localTasks[col.id].some(t => t.id === over.id)) {
          targetColumn = col.id
          break
        }
      }
    }

    if (!targetColumn) return

    // Find the task
    let movedTask: Task | undefined
    const sourceColumn = Object.keys(localTasks).find(col => 
      localTasks[col as TaskStatus].some(t => t.id === taskId)
    ) as TaskStatus | undefined

    if (!sourceColumn) return
    movedTask = localTasks[sourceColumn].find(t => t.id === taskId)

    if (!movedTask || sourceColumn === targetColumn) return

    // Update local state instantly for smooth UI
    setLocalTasks(prev => ({
      ...prev,
      [sourceColumn]: prev[sourceColumn].filter(t => t.id !== taskId),
      [targetColumn]: [...prev[targetColumn], movedTask!]
    }))

    // Send PATCH request to Django backend
    updateStatus.mutate({ id: taskId, status: targetColumn })
  }

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (isError) return <div className="text-center py-12 text-red-500">Failed to load tasks. Is the Django backend running?</div>

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4 h-full">
        {COLUMNS.map(col => (
          <KanbanColumn key={col.id} title={col.title} tasks={localTasks[col.id]} />
        ))}
      </div>
    </DndContext>
  )
}
