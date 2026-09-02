import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Project } from '@/types/project'

interface ActivityChartProps {
  projects: Project[]
}

export default function ActivityChart({ projects }: ActivityChartProps) {
  const priorityCounts = projects.reduce((acc, project) => {
    const p = project.priority?.toLowerCase() || 'medium'
    acc[p] = (acc[p] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const data = [
    { name: 'Low', count: priorityCounts.low || 0, fill: '#6b7280' },
    { name: 'Medium', count: priorityCounts.medium || 0, fill: '#3b82f6' },
    { name: 'High', count: priorityCounts.high || 0, fill: '#f59e0b' },
    { name: 'Critical', count: priorityCounts.critical || 0, fill: '#ef4444' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Projects by Priority</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
