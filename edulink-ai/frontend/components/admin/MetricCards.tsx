import { DashboardMetrics } from '@/types'

interface Props { metrics: DashboardMetrics }

export default function MetricCards({ metrics }: Props) {
  const cards = [
    { label: '총 학생수', value: metrics.totalStudents, unit: '명', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '오늘 활성', value: metrics.activeToday, unit: '명', color: 'text-green-600', bg: 'bg-green-50' },
    { label: '이탈 위험', value: metrics.atRiskCount, unit: '명', color: 'text-red-600', bg: 'bg-red-50' },
    { label: '평균 진도', value: `${metrics.avgProgressPct}`, unit: '%', color: 'text-purple-600', bg: 'bg-purple-50' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className={`rounded-xl p-5 ${c.bg}`}>
          <p className="text-sm text-gray-600 mb-1">{c.label}</p>
          <p className={`text-3xl font-bold ${c.color}`}>{c.value}<span className="text-lg ml-1">{c.unit}</span></p>
        </div>
      ))}
    </div>
  )
}
