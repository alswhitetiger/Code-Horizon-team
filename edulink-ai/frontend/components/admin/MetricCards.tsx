import { DashboardMetrics } from '@/types'

interface Props { metrics: DashboardMetrics }

export default function MetricCards({ metrics }: Props) {
  const cards = [
    { label: '총 학생수', value: metrics.totalStudents, unit: '명', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: '오늘 활성', value: metrics.activeToday, unit: '명', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
    { label: '이탈 위험', value: metrics.atRiskCount, unit: '명', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
    { label: '평균 진도', value: `${metrics.avgProgressPct}`, unit: '%', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {cards.map(c => (
        <div key={c.label} className={`rounded-xl p-4 sm:p-5 ${c.bg}`}>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">{c.label}</p>
          <p className={`text-2xl sm:text-3xl font-bold ${c.color}`}>{c.value}<span className="text-base sm:text-lg ml-1">{c.unit}</span></p>
        </div>
      ))}
    </div>
  )
}
