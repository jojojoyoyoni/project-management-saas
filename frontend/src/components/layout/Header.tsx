import { FaRegBell, FaMagnifyingGlass } from 'react-icons/fa6'

export default function Header() {
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
      <div className="flex items-center space-x-4 ml-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          <FaRegBell className="h-5 w-5" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
        </button>

        {/* User Avatar Placeholder */}
        <button className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            J
          </div>
        </button>
      </div>
    </header>
  )
}
