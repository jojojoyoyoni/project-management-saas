import { useOrganizations } from '@/api/hooks/useOrganizations'
import Spinner from '@/components/common/Spinner'
import { FaBuilding, FaUserShield } from 'react-icons/fa6'

export default function AdminOrganizationsPage() {
  const { data: orgs, isLoading, isError } = useOrganizations()

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (isError) return <div className="text-center py-12 text-red-500">Failed to load organizations.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FaBuilding className="text-indigo-600 text-3xl" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Organizations</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Platform-wide overview of all created organizations.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Owner (Creator)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Members</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created At</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {orgs?.map((org: any) => (
              <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-3 overflow-hidden flex-shrink-0">
                      {org.logo ? (
                        <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
                      ) : (
                        <FaBuilding className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{org.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-[10px] font-bold">
                      {org.owner?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {org.owner?.first_name ? `${org.owner.first_name} ${org.owner.last_name}` : org.owner?.username || 'Unknown'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${org.plan === 'free' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                    {org.plan}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{org.member_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(org.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}