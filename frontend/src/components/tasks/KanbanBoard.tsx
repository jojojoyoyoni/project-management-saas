import { useState, useEffect } from 'react'
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useTasks, useUpdateTaskStatus, useTaskStatuses } from '@/api/hooks/useTasks'
import KanbanColumn from './KanbanColumn'
import TaskForm from './TaskForm'
import TaskDetail from './TaskDetail'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import Spinner from '@/components/common/Spinner'
import type { Task, TaskStatus } from '@/types/task'

// Removed hardcoded COLUMNS. Now they come from the database!

interface KanbanBoardProps {
  projectId: string
}

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data, isLoading, isError } = useTasks(projectId)
  const { data: columns } = useTaskStatuses(projectId)
  const updateStatus = useUpdateTaskStatus()
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  
  // localTasks is now a dynamic Record of slug -> Task[]
  const [localTasks, setLocalTasks] = useState<Record<string, Task[]>>({})

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  )

  // Group tasks whenever tasks OR columns change
  useEffect(() => {
    if (data?.results && columns) {
      const grouped: Record<string, Task[]> = {}
      
      // Initialize empty arrays for each column slug
      columns.forEach((col: any) => {
        grouped[col.slug] = []
      })

      // Put tasks in their respective columns
      data.results.forEach(task => {
        const statusSlug = task.status?.slug
        if (statusSlug && grouped[statusSlug]) {
          grouped[statusSlug].push(task)
        } else if (columns.length > 0) {
          // Fallback: if a task has a status not in columns, put it in the first column
          grouped[columns[0].slug]?.push(task)
        }
      })
      setLocalTasks(grouped)
    }
  }, [data, columns])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !columns) return

    const taskId = String(active.id)
    const overId = String(over.id)

    // Find which column we dropped into
    let targetColumnSlug: string | null = null
    for (const col of columns) {
      if (col.slug === overId || localTasks[col.slug]?.some(t => String(t.id) === overId)) {
        targetColumnSlug = col.slug
        break
      }
    }

    if (!targetColumnSlug) return

    // Find which column the task came from
    const sourceColumnSlug = Object.keys(localTasks).find(slug => 
      localTasks[slug]?.some(t => String(t.id) === taskId)
    )

    if (!sourceColumnSlug || sourceColumnSlug === targetColumnSlug) return

    const movedTask = localTasks[sourceColumnSlug]?.find(t => String(t.id) === taskId)
    if (!movedTask) return

    // Optimistic UI update
    setLocalTasks(prev => {
      // Safely copy the previous state
      const newState = { ...prev }
      
      // Remove from source
      newState[sourceColumnSlug] = (newState[sourceColumnSlug] || []).filter(
        t => String(t.id) !== taskId
      )
       // Add to target
      newState[targetColumnSlug] = [
        ...(newState[targetColumnSlug] || []), 
        { ...movedTask, status: { ...movedTask.status, slug: targetColumnSlug as TaskStatus } }
      ]
      
      return newState
    })

    // Send to Django
      updateStatus.mutate({ projectId, taskId, status: targetColumnSlug as TaskStatus })
  }
  

  if (isLoading || !columns) return <div className="flex justify-center py-12"><Spinner /></div>
  if (isError) return <div className="text-center py-12 text-red-500">Failed to load tasks.</div>

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsCreateModalOpen(true)}>
          + Add Task
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4 flex-1">
          {columns.map((col: any) => (
            <KanbanColumn 
              key={col.id} 
              title={col.name} 
              tasks={localTasks[col.slug] || []}
              onTaskClick={(taskId) => setSelectedTaskId(taskId)} 
            />
          ))}
        </div>
      </DndContext>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Task">
        <TaskForm projectId={projectId} onClose={() => setIsCreateModalOpen(false)} />
      </Modal>

      <Modal isOpen={!!selectedTaskId} onClose={() => setSelectedTaskId(null)} title="Task Details">
        {selectedTaskId && (
          <TaskDetail projectId={projectId} taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
        )}
      </Modal>
    </div>
  )
}