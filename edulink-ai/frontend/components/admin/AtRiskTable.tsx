import { StudentRisk } from '@/types'
import { formatDate, getRiskColor } from '@/lib/utils'

interface Props { students: StudentRisk[] }

export default function AtRiskTable({ students }: Props) {
  if (!students.length) return (
    <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">이탈 위험 학생이 없습니다.</p>
  )
  return (
    <>
      {/* 데스크탑 테이블 */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {['학생명', '위험도', '진도율', '마지막 접속', '사유'].map(h => (
                <th key={h} className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.studentId} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{s.name}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(s.riskLevel)}`}>
                    {s.riskLevel} ({s.riskScore}점)
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 w-16">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${s.progressPct}%` }} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{s.progressPct}%</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{formatDate(s.lastActiveAt)}</td>
                <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{s.reasons.slice(0, 2).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 뷰 */}
      <div className="sm:hidden space-y-3">
        {students.map(s => (
          <div key={s.studentId} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900 dark:text-gray-100">{s.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(s.riskLevel)}`}>
                {s.riskLevel} ({s.riskScore}점)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400 w-14 shrink-0">진도율</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${s.progressPct}%` }} />
              </div>
              <span className="text-gray-700 dark:text-gray-300 text-xs">{s.progressPct}%</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              최근 접속: {formatDate(s.lastActiveAt)} · {s.reasons.slice(0, 2).join(', ')}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}
