import { useTaskActivities } from '@/api/hooks/useTasks'
import Spinner from '@/components/common/Spinner'

interface TaskActivityProps {
  projectId: string
  taskId: string
}

export default function TaskActivity({ projectId, taskId }: TaskActivityProps) {
  const { data: activities, isLoading } = useTaskActivities(projectId, taskId)

  if (isLoading) return <div className="flex justify-center py-4"><Spinner /></div>

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Activity</h3>
      
      {activities && activities.length > 0 ? (
        <div className="space-y-4 max-h-40 overflow-y-auto pr-2">
          {activities.map((activity: any) => (
            <div key={activity.id} className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{activity.user?.username || 'System'}</span>
                  {' '}
                  <span className="text-gray-500 dark:text-gray-400">{activity.description}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No activity yet.</p>
      )}
    </div>
  )
}