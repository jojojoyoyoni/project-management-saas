import { useState, useEffect } from 'react'
import { useDeleteTask, useTaskDetails, useUpdateTask } from '@/api/hooks/useTasks'
import TaskComments from './TaskComments'
import TaskActivity from './TaskActivity'

import Button from '@/components/common/Button'
import Spinner from '@/components/common/Spinner'
import { FaTrash } from 'react-icons/fa6'
import { useProjectMembers } from '@/api/hooks/useProjects'

interface TaskDetailProps {
  projectId: string
  taskId: string
  onClose: () => void
}

export default function TaskDetail({ projectId, taskId, onClose }: TaskDetailProps) {
  const { data: task, isLoading } = useTaskDetails(projectId, taskId)
  const updateTask = useUpdateTask()
  const [assignee, setAssignee] = useState('')
  const [dueDate, setDueDate] = useState('')
  const deleteTask = useDeleteTask()
  

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('to-do')
  const [priority, setPriority] = useState('medium')

  const { data: members } = useProjectMembers(projectId, '')
  


  // Populate form when task data arrives
  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setDescription(task.description || '')
      setStatus(task.status?.slug || 'to-do')
      setPriority(task.priority?.slug || 'medium')
      setAssignee(task.assignee?.id != null ? String(task.assignee.id) : '')
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '') // Format date for input
    }
  }, [task])

  const handleSave = () => {
    updateTask.mutate({
      projectId,
      taskId,
      taskData: {
        title,
        description,
        status,       // Sends slug to backend
        priority,     // Sends slug to backend
        assignee: assignee || null,
        due_date: dueDate || null,
      }
    })
  }
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate({ projectId, taskId }, {
        onSuccess: () => {
          onClose() // Close modal after deletion
        }
      })
    }
  }

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  return (
    <div className="flex flex-col h-full">
       {/* Header with Delete Button */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={handleDelete} 
          className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Delete Task"
        >
          <FaTrash />
        </button>
      </div>
      {/* Editable Fields Area */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Task Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="to-do">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

       
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Unassigned</option>
              {members?.map((m: any) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.first_name ? `${m.user.first_name} ${m.user.last_name}` : m.user.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            placeholder="Add more details..."
          />
        </div>

         {/* Comments Section */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <TaskComments projectId={projectId} taskId={taskId} />
        </div>

        {/* Activity Log Section */}
        <TaskActivity projectId={projectId} taskId={taskId} />
      </div>


      {/* Action Buttons placed at the very bottom, completely separate */}
      <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} isLoading={updateTask.isPending}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}