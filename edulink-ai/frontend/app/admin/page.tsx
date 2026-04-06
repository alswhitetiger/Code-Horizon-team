'use client'
import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/api'
import { DashboardMetrics, StudentRisk } from '@/types'
import Card from '@/components/ui/Card'
import MetricCards from '@/components/admin/MetricCards'
import AtRiskTable from '@/components/admin/AtRiskTable'
import ReportGenerator from '@/components/admin/ReportGenerator'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { mockDashboard, mockAtRisk } from '@/lib/mock-data'

const weeklyData = [
  { date: '월', active: 40, submissions: 15 },
  { date: '화', active: 52, submissions: 22 },
  { date: '수', active: 45, submissions: 18 },
  { date: '목', active: 60, submissions: 30 },
  { date: '금', active: 55, submissions: 25 },
  { date: '토', active: 20, submissions: 5 },
  { date: '일', active: 15, submissions: 3 },
]

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(mockDashboard)
  const [atRisk, setAtRisk] = useState<StudentRisk[]>(mockAtRisk)

  useEffect(() => {
    const load = async () => {
      try {
        const [m, r] = await Promise.all([adminAPI.getDashboard(), adminAPI.getAtRisk()])
        setMetrics(m); setAtRisk(r)
      } catch { /* use mock */ }
    }
    load()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">관리자 대시보드</h1>
        <p className="text-gray-500 text-sm">전체 학습 현황을 모니터링합니다.</p>
      </div>

      <MetricCards metrics={metrics} />

      <Card>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">주간 활성 현황</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="active" stroke="#6366f1" strokeWidth={2} name="활성 학생" />
              <Line type="monotone" dataKey="submissions" stroke="#10b981" strokeWidth={2} name="제출 수" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">이탈 위험 학생</h2>
        <AtRiskTable students={atRisk} />
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">AI 자동 리포트</h2>
        <ReportGenerator />
      </Card>
    </div>
  )
}
