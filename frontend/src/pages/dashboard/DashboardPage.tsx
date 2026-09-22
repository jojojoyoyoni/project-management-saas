import { useOrgDashboard, useOrganizations } from '@/api/hooks/useOrganizations'
import { useAppSelector } from '@/store'
import Spinner from '@/components/common/Spinner'
import { FaFolderOpen, FaListCheck, FaCircleExclamation, FaChartPie, FaFilePdf } from 'react-icons/fa6'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function DashboardPage() {
  const activeOrgId = useAppSelector((state: any) => state.org?.activeOrganizationId)
  const { data, isLoading } = useOrgDashboard(activeOrgId)
  
  // ADD THIS: Fetch orgs to get the name
  const { data: organizations = [] } = useOrganizations()
  const activeOrg = organizations.find((org: any) => org.id === activeOrgId)
  const orgName = activeOrg?.name || "Unknown Organization"

  if (isLoading || !activeOrgId) return <div className="flex justify-center py-12"><Spinner /></div>

  const stats = data?.stats

  // Format Status Data for Pie Chart
  const statusData = data?.task_by_status?.map((item: any) => ({
    name: item.status__name || 'Unassigned',
    value: item.count,
    color: item.status__color || '#6366f1'
  })) || []

  // Format Trend Data for Line Chart
  const trendData = data?.completion_trend?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    completed: item.count
  })) || []

  // --- PDF EXPORT FUNCTION ---
  const handleExportPDF = () => {
    // Trigger the browser's print dialog
    // The user can then select "Save as PDF" from the printer list
    window.print()
  }

  return (
    <div className="space-y-6">
        {/* --- PRINT ONLY HEADER --- */}
      <div className="hidden print:block mb-8">
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ProjectFlow</h1>
            <h2 className="text-xl font-semibold text-gray-700 mt-1">Executive Dashboard Report</h2>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Organization:</p>
            <p className="text-lg font-bold text-gray-900">{orgName}</p>
            <p className="text-sm text-gray-500 mt-2">Generated on: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      {/* Header & Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print-hide">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            High-level overview of all projects and tasks in your organization.
          </p>
        </div>
        
        {/* EXPORT TO PDF BUTTON */}
        <button 
          onClick={handleExportPDF}
          className="print:hidden flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
        >
          <FaFilePdf className="h-4 w-4" />
          Export to PDF
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FaFolderOpen />} label="Active Projects" value={stats?.total_projects || 0} color="indigo" />
        <StatCard icon={<FaListCheck />} label="Total Tasks" value={stats?.total_tasks || 0} color="blue" />
        <StatCard icon={<FaChartPie />} label="Overall Completion" value={`${stats?.overall_completion || 0}%`} color="green" />
        <StatCard icon={<FaCircleExclamation />} label="Overdue Tasks" value={stats?.overdue_tasks || 0} color="red" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Task Status Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Distribution</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                  {statusData.map((entry: { color: string, index: number }) => (
                    <Cell key={`cell-${entry.index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completion Trend Line Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Completion Trend (Last 7 Days)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" />
                {/* Force Y-axis to start at 0 so growth looks proportional */}
                <YAxis stroke="#9ca3af" allowDecimals={false} domain={[0, 'auto']} />
                <Tooltip cursor={{ stroke: '#6366f1', strokeWidth: 2 }} />
                
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  // Make the markers (dots) prominent with a white border
                  dot={{ fill: '#6366f1', r: 5, strokeWidth: 2, stroke: '#ffffff' }} 
                  activeDot={{ r: 7 }} 
                  // Show the exact number above each dot
                  label={{ position: 'top', fill: '#374151', fontSize: 12, fontWeight: 'bold' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Project Breakdown Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project Progress</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Tasks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Progress</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data?.projects?.map((proj: any) => (
                <tr key={proj.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/projects/${proj.id}`} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                      {proj.name}
                    </Link>
                    <div className="text-xs text-gray-400 font-mono">{proj.key}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{proj.total_tasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap w-1/3">
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${proj.completion_rate === 100 ? 'bg-green-500' : 'bg-indigo-600'}`} 
                          style={{ width: `${proj.completion_rate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{proj.completion_rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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