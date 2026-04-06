'use client'
import { useState } from 'react'
import { adminAPI } from '@/lib/api'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ReportGenerator() {
  const [period, setPeriod] = useState('week')
  const [report, setReport] = useState<{
    summary?: string;
    highlights?: string[];
    concerns?: string[];
    recommendations?: string[];
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try { setReport(await adminAPI.getReport(undefined, period)) }
    catch { alert('리포트 생성에 실패했습니다.') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <select value={period} onChange={e => setPeriod(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="week">이번 주</option>
          <option value="month">이번 달</option>
          <option value="quarter">이번 분기</option>
        </select>
        <Button onClick={generate} disabled={loading}>리포트 생성</Button>
      </div>
      {loading && <LoadingSpinner />}
      {report && (
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <p className="text-gray-800">{report.summary}</p>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">주요 현황</h4>
            <ul className="space-y-1">{(report.highlights || []).map((h: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-green-500 mt-0.5">✓</span>{h}</li>
            ))}</ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">우려 사항</h4>
            <ul className="space-y-1">{(report.concerns || []).map((c: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-red-500 mt-0.5">!</span>{c}</li>
            ))}</ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">권고 조치</h4>
            <ul className="space-y-1">{(report.recommendations || []).map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-blue-500 mt-0.5">→</span>{r}</li>
            ))}</ul>
          </div>
        </div>
      )}
    </div>
  )
}
