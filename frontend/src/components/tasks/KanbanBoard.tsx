import { useState, useEffect, useMemo } from 'react'
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useTasks, useUpdateTaskStatus, useTaskStatuses } from '@/api/hooks/useTasks'
import CreateStatusModal from './CreateStatusModal'

import { useProjectMembers } from '@/api/hooks/useProjects'
import KanbanColumn from './KanbanColumn'
import TaskForm from './TaskForm'
import TaskDetail from './TaskDetail'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import Spinner from '@/components/common/Spinner'
import type { Task, TaskStatus } from '@/types/task'

interface KanbanBoardProps {
  projectId: string
}


export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data, isLoading, isError } = useTasks(projectId)
  const { data: columns } = useTaskStatuses(projectId)
  const { data: members } = useProjectMembers(projectId, '')
  const updateStatus = useUpdateTaskStatus()
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [localTasks, setLocalTasks] = useState<Record<string, Task[]>>({})
  
  // NEW: Search and Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  )

  // useMemo is great for filtering performance so it only recalculates when data/search changes
  const filteredTasks = useMemo(() => {
    if (!data?.results) return []
    
    return data.results.filter(task => {
      // Filter by search term (title)
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filter by assignee
      const matchesAssignee = assigneeFilter 
        ? String(task.assignee?.id) === assigneeFilter 
        : true

      return matchesSearch && matchesAssignee
    })
  }, [data, searchTerm, assigneeFilter])

  // Group the FILTERED tasks into columns
  useEffect(() => {
    if (filteredTasks && columns) {
      const grouped: Record<string, Task[]> = {}
      columns.forEach((col: any) => {
        grouped[col.slug] = []
      })

      filteredTasks.forEach(task => {
        const statusSlug = task.status?.slug
        if (statusSlug && grouped[statusSlug]) {
          grouped[statusSlug].push(task)
        }
      })
      setLocalTasks(grouped)
    }
  }, [filteredTasks, columns])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !columns) return

    const taskId = String(active.id)
    const overId = String(over.id)

    let targetColumnSlug: string | null = null
    for (const col of columns) {
      if (col.slug === overId || localTasks[col.slug]?.some(t => String(t.id) === overId)) {
        targetColumnSlug = col.slug
        break
      }
    }

    if (!targetColumnSlug) return

    const sourceColumnSlug = Object.keys(localTasks).find(slug => 
      localTasks[slug]?.some(t => String(t.id) === taskId)
    )

    if (!sourceColumnSlug || sourceColumnSlug === targetColumnSlug) return

    const movedTask = localTasks[sourceColumnSlug]?.find(t => String(t.id) === taskId)
    if (!movedTask) return

    setLocalTasks(prev => {
      const newState = { ...prev }
      newState[sourceColumnSlug] = (newState[sourceColumnSlug] || []).filter(t => String(t.id) !== taskId)
      newState[targetColumnSlug] = [
        ...(newState[targetColumnSlug] || []), 
        { ...movedTask, status: { ...movedTask.status, slug: targetColumnSlug as TaskStatus } }
      ]
      return newState
    })

    updateStatus.mutate({ projectId, taskId, status: targetColumnSlug as TaskStatus })
  }

  if (isLoading || !columns) return <div className="flex justify-center py-12"><Spinner /></div>
  if (isError) return <div className="text-center py-12 text-red-500">Failed to load tasks.</div>

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tasks by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex-shrink-0">
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Assignees</option>

              {members?.map((m: any) => {
              const userId = m.user?.id || m.id;
              const userName = m.user ? (m.user.first_name ? `${m.user.first_name} ${m.user.last_name}` : m.user.username) : m.username;
              return (
                <option key={userId} value={userId}>
                  {userName}
                </option>
              );
            })}

          </select>
        </div>

        <div className="flex-shrink-0">
          <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
            + Add Task
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4 flex-1">
          {columns.map((col: any) => (
            <KanbanColumn 
              key={col.id} 
              title={col.name} 
              tasks={localTasks[col.slug] || []}
              onTaskClick={(taskId) => setSelectedTaskId(taskId)} 
              color={col.color}
            />
          ))}
        </div>
                {/* ADD THIS: Add Column Button */}
        <div className="flex-shrink-0 w-72">
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            + Add Column
          </button>
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
          {/* ADD THIS: Create Status Modal */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Create New Column">
        <CreateStatusModal projectId={projectId} onClose={() => setIsStatusModalOpen(false)} />
      </Modal>
    </div>
  )
}