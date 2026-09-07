import { useState } from 'react'
import { useCreateTaskStatus } from '@/api/hooks/useTasks'
import Button from '@/components/common/Button'

interface CreateStatusModalProps {
  projectId: string
  onClose: () => void
}

export default function CreateStatusModal({ projectId, onClose }: CreateStatusModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1') // Default indigo
  const createStatus = useCreateTaskStatus(projectId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    createStatus.mutate({ name, color }, {
      onSuccess: () => {
        onClose()
      }
    })
  }

  const colors = ['#6366f1', '#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Column Name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Code Review"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {createStatus.isError && (
        <p className="text-sm text-red-500">Failed to create column. Please try again.</p>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" isLoading={createStatus.isPending}>Create Column</Button>
      </div>
    </form>
  )
}