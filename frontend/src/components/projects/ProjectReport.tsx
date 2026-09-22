import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useProjectReport } from '@/api/hooks/useProjects'
import Spinner from '@/components/common/Spinner'
import { FaCircleExclamation, FaClock, FaListCheck, FaChartPie } from 'react-icons/fa6'

interface ProjectReportProps {
  projectId: string
}

export default function ProjectReport({ projectId }: ProjectReportProps) {
  const { data, isLoading } = useProjectReport(projectId)
  // Fix: Do the loading check BEFORE calling the hook
  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>
  // 1. Format Status Data for Pie Chart
  const statusData = data?.task_by_status?.map((item: any) => ({
    name: item.status__name || 'Unassigned',
    value: item.count,
    color: item.status__color || '#6366f1'
  })) || []

  // 2. Format Priority Data for Bar Chart
  const priorityData = data?.task_by_priority?.map((item: any) => ({
    name: item.priority__name || 'None',
    count: item.count
  })) || []

  // 3. Format Assignee Data for Workload Chart
  const workloadData = data?.task_by_assignee?.map((item: any) => ({
    name: item.assignee__username || 'Unassigned',
    tasks: item.count
  })) || []

  // 4. Format Task Type Data
  const typeData = data?.task_by_type?.map((item: any) => ({
    name: item.task_type || 'Task',
    value: item.count
  })) || []

  // Time tracking calculations
  const totalEstimated = data?.time_tracking?.total_estimated || 0
  const totalSpent = data?.time_tracking?.total_spent || 0
  const timeProgress = totalEstimated > 0 ? (totalSpent / totalEstimated) * 100 : 0

  return (
    <div className="space-y-6 pb-8">
      {/* Top Stats Cards (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<FaListCheck />} 
          label="Total Tasks" 
          value={data?.stats?.total_tasks || 0} 
          color="indigo" 
        />
        <StatCard 
          icon={<FaChartPie />} 
          label="Completion Rate" 
          value={`${data?.stats?.completion_rate || 0}%`} 
          color="green" 
        />
        <StatCard 
          icon={<FaCircleExclamation />} 
          label="Overdue Tasks" 
          value={data?.overdue_count || 0} 
          color="red" 
        />
        <StatCard 
          icon={<FaClock />} 
          label="Time Spent (hrs)" 
          value={totalSpent} 
          color="blue" 
        />
      </div>
            {/* Actionable Lists (Tables) */}
      <div className="grid grid-cols-1 gap-6">
        {/* Overdue Tasks Table */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <FaCircleExclamation /> Action Required: Overdue Tasks
          </h3>
          
          {data?.overdue_tasks?.length === 0 ? (
            <div className="text-center py-8 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">🎉 No overdue tasks! Everything is on track.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assignee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data?.overdue_tasks?.map((task: any) => (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-mono text-gray-400">{task.key}</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {task.assignee__username || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 font-medium">
                        {new Date(task.due_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Task by Status (Pie Chart) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tasks by Status</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                  {statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Workload (Horizontal Bar Chart) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Workload</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#9ca3af" width={80} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="tasks" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task by Priority (Vertical Bar Chart) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tasks by Priority</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Tracking & Task Types */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time Tracking</h3>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">{totalSpent} hrs spent</span>
              <span className="text-gray-500 dark:text-gray-400">{totalEstimated} hrs estimated</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${timeProgress > 100 ? 'bg-red-500' : 'bg-indigo-600'}`} 
                style={{ width: `${Math.min(timeProgress, 100)}%` }}
              ></div>
            </div>
            {timeProgress > 100 && (
              <p className="text-xs text-red-500 mt-1">Over budget by {(totalSpent - totalEstimated).toFixed(1)} hours!</p>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 mt-2">Task Types</h3>
          <div className="h-40 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" labelLine={false} outerRadius={50} fill="#82ca9d" dataKey="value">
                  <Cell fill="#6366f1" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#22c55e" />
                  <Cell fill="#f97316" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}

// Helper Stat Card Component
function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
    </div>
  )
}