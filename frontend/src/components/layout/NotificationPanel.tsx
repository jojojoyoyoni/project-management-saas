import { useNotifications, useMarkNotificationsRead } from '@/api/hooks/useNotifications'
import { useNavigate } from 'react-router-dom'

export default function NotificationPanel() {
  const { data } = useNotifications()
  const markRead = useMarkNotificationsRead()
  const navigate = useNavigate()

  const notifications = data?.results || []
  const unreadCount = data?.unread_count || 0

  const handleClick = () => {
    if (unreadCount > 0) {
      markRead.mutate()
    }
  }

const handleNotifClick = (n: any) => {

    // If it's a task notification, route to the task's project
    if (n.project_id) {
      navigate(`/projects/${n.project_id}`)
    } 
    // If it's a project notification, route to the project
    else if (n.project_id_from_project) {
      navigate(`/projects/${n.project_id_from_project}`)
    }
  }


  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
        {unreadCount > 0 && (
          <button onClick={handleClick} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            Mark all read
          </button>
        )}
      </div>
      
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
        {notifications.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400 dark:text-gray-500">No notifications yet.</p>
        ) : (
          notifications.map((n: any) => (
            <div 
              key={n.id} 
              onClick={() => handleNotifClick(n.project_id)}
              className={`p-4 flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!n.is_read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {n.actor?.username?.[0]?.toUpperCase() || 'S'}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">{n.actor?.username || 'System'}</span> {n.verb}
                </p>
                {n.task_title && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 truncate">Task: {n.task_title}</p>
                )}
                {n.project_name && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 truncate">Project: {n.project_name}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {!n.is_read && <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}