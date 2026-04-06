import { StudentRisk } from '@/types'
import { formatDate, getRiskColor } from '@/lib/utils'

interface Props { students: StudentRisk[] }

export default function AtRiskTable({ students }: Props) {
  if (!students.length) return <p className="text-gray-500 text-sm text-center py-8">이탈 위험 학생이 없습니다.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-200">
          {['학생명', '위험도', '진도율', '마지막 접속', '사유'].map(h => (
            <th key={h} className="text-left py-3 px-4 font-medium text-gray-600">{h}</th>
          ))}
        </tr></thead>
        <tbody>{students.map(s => (
          <tr key={s.studentId} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4 font-medium">{s.name}</td>
            <td className="py-3 px-4">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(s.riskLevel)}`}>
                {s.riskLevel} ({s.riskScore}점)
              </span>
            </td>
            <td className="py-3 px-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-16">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${s.progressPct}%` }} />
                </div>
                <span>{s.progressPct}%</span>
              </div>
            </td>
            <td className="py-3 px-4 text-gray-500">{formatDate(s.lastActiveAt)}</td>
            <td className="py-3 px-4 text-gray-500">{s.reasons.slice(0, 2).join(', ')}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
