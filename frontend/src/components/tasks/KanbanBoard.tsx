import { useState, useEffect } from 'react'
import { DndContext, closestCorners, type DragEndEvent } from '@dnd-kit/core'
import { useTasks, useUpdateTaskStatus } from '@/api/hooks/useTasks'
import KanbanColumn from './KanbanColumn'
import TaskForm from './TaskForm'
import Modal from '@/components/common/Modal' // Adjust path if needed
import Button from '@/components/common/Button' // Adjust path if needed
import Spinner from '@/components/common/Spinner'
import type { Task, TaskStatus } from '@/types/task'

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'to-do', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
]

interface KanbanBoardProps {
  projectId: string
}

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data, isLoading, isError } = useTasks(projectId)
  const updateStatus = useUpdateTaskStatus()
  const [isModalOpen, setIsModalOpen] = useState(false) // <-- Modal state

  
  const [localTasks, setLocalTasks] = useState<Record<TaskStatus, Task[]>>({
    'to-do': [], 
    'in-progress': [], 
    'done': []
  })

  useEffect(() => {
    if (data?.results) {
      const grouped: Record<TaskStatus, Task[]> = {
        'to-do': [], 
        'in-progress': [], 
        'done': []
      }
      
      data.results.forEach(task => {
        const statusSlug = task.status?.slug
        
        if (statusSlug && grouped[statusSlug]) {
          grouped[statusSlug].push(task)
        }
      })
      setLocalTasks(grouped)
    }
  }, [data])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    // Force IDs to strings for safe comparison
    const taskId = String(active.id)
    const overId = String(over.id)

    let targetColumn: TaskStatus | null = null

    for (const col of COLUMNS) {
      // Check if dropped on the column itself, or on a task inside the column
      if (col.id === overId || localTasks[col.id]?.some(t => String(t.id) === overId)) {
        targetColumn = col.id
        break
      }
    }

    if (!targetColumn) return

    const sourceColumn = Object.keys(localTasks).find(col => 
      localTasks[col as TaskStatus]?.some(t => String(t.id) === taskId)
    ) as TaskStatus | undefined

    if (!sourceColumn || sourceColumn === targetColumn) return

    const movedTask = localTasks[sourceColumn]?.find(t => String(t.id) === taskId)
    if (!movedTask) return

    // Optimistic UI update
    setLocalTasks(prev => ({
      ...prev,
      [sourceColumn]: prev[sourceColumn].filter(t => String(t.id) !== taskId),
      [targetColumn]: [...prev[targetColumn], { ...movedTask, status: { ...movedTask.status, slug: targetColumn } }]
    }))

    // Send the string slug to Django
    updateStatus.mutate({ projectId, taskId, status: targetColumn })
  }

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (isError) return <div className="text-center py-12 text-red-500">Failed to load tasks.</div>

  return (
   <div className="h-full flex flex-col">
      {/* Header with Add Button */}
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsModalOpen(true)}>
          + Add Task
        </Button>
      </div>

      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4 flex-1">
          {COLUMNS.map(col => (
            <KanbanColumn 
              key={col.id} 
              title={col.title} 
              tasks={localTasks[col.id] || []} 
            />
          ))}
        </div>
      </DndContext>

      {/* Task Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Task">
        <TaskForm projectId={projectId} onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  
  )
}

