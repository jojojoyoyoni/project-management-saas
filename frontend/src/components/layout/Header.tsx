import { useNavigate } from 'react-router-dom'
import { FaRegBell, FaMagnifyingGlass, FaSun, FaMoon, FaRightFromBracket } from 'react-icons/fa6'
import { useTheme } from '@/context/ThemeContext'
import { useLogout } from '@/api/hooks/useAuth'
import { useAppSelector } from '@/store'
import { useNotifications } from '@/api/hooks/useNotifications'
import NotificationPanel from './NotificationPanel'
import { useState } from 'react'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const logoutMutation = useLogout()
  const navigate = useNavigate()

    // Fetch notifications to get the unread count for the red badge
  const { data: notifData } = useNotifications()
  const unreadCount = notifData?.unread_count || 0
  
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  
  // Get user from Redux for the avatar initial
  const { user } = useAppSelector((state) => state.auth)
  const userInitial = user?.first_name?.[0]?.toUpperCase() || 'U'

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search projects, tasks..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-2 ml-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          title="Toggle Dark Mode"
        >
          {isDark ? <FaSun className="h-5 w-5 text-yellow-400" /> : <FaMoon className="h-5 w-5" />}
        </button>

        {/* Notifications Wrapper */}
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <FaRegBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
            )}
          </button>
          
          {isNotifOpen && <NotificationPanel />}
        </div>
        {/* User Avatar -> Links to Settings */}
        <button 
          onClick={() => navigate('/settings')}
          className="flex items-center space-x-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Profile Settings"
        >
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {userInitial}
          </div>
        </button>

        {/* Logout Button */}
        <button 
          onClick={() => logoutMutation.mutate()}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors"
          title="Logout"
          disabled={logoutMutation.isPending}
        >
          <FaRightFromBracket className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}