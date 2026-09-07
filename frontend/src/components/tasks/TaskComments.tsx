import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTaskComments, createTaskComment } from '@/api/queries/taskQueries'
import Button from '@/components/common/Button'
import Spinner from '@/components/common/Spinner'

interface TaskCommentsProps {
  projectId: string
  taskId: string
}

export default function TaskComments({ projectId, taskId }: TaskCommentsProps) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: () => getTaskComments(projectId, taskId),
  })

  const mutation = useMutation({
    mutationFn: (newContent: string) => createTaskComment({ projectId, taskId, content: newContent }),
    onSuccess: () => {
      setContent('') // Clear input
      queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    mutation.mutate(content)
  }

  const comments = data?.results || data || []

  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Comments</h3>
      
      {isLoading ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4 max-h-60 overflow-y-auto mb-4 pr-2">
          {comments.map((comment: any) => (
            <div key={comment.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {comment.author?.first_name || comment.author?.username || 'User'}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
        />
        <Button type="submit" isLoading={mutation.isPending}>Post</Button>
      </form>
    </div>
  )
}