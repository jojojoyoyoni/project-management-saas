import { useAllUsers } from '@/api/hooks/useAuth'
import Spinner from '@/components/common/Spinner'
import { FaUserShield, FaCircleCheck, FaUser } from 'react-icons/fa6'

export default function AdminUsersPage() {
  const { data: users, isLoading, isError } = useAllUsers()

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (isError) return <div className="text-center py-12 text-red-500">Failed to load users. (Are you a Super Admin?)</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FaUserShield className="text-indigo-600 text-3xl" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Administration</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage all users across all organizations on the platform.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users?.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm mr-3">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</span>
                    {user.first_name && <span className="ml-2 text-sm text-gray-500">({user.first_name})</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role || 'member'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_superuser ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      <FaUserShield className="h-3 w-3" /> Super Admin
                    </span>
                  ) : user.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      <FaCircleCheck className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      <FaUser className="h-3 w-3" /> Suspended
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}