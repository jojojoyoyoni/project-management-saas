import { useProjects } from '@/api/hooks/useProjects'
import StatsCards from '@/components/dashboard/StatsCards'
import RecentProjects from '@/components/dashboard/RecentProjects'
import ActivityChart from '@/components/dashboard/ActivityChart'
import Spinner from '@/components/common/Spinner'

export default function DashboardPage() {
  const { data, isLoading, isError } = useProjects()
  
  const projects = data?.results || []

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>
  
  if (isError) {
    return (
      <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400 font-medium">Failed to load dashboard data</p>
        <p className="text-sm text-red-500 dark:text-red-300 mt-1">Could not connect to Django backend.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome back! Here's what's happening with your projects.
        </p>
      </div>

      <StatsCards projects={projects} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentProjects projects={projects} />
        <ActivityChart projects={projects} />
      </div>
    </div>
  )
}
