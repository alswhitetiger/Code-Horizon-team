'use client'
import { Submission } from '@/types'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface Props { submissions: Submission[] }

export default function SubmissionList({ submissions }: Props) {
  if (!submissions.length) return <p className="text-gray-500 text-sm text-center py-8">제출된 답안이 없습니다.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4 font-medium text-gray-600">학생명</th>
          <th className="text-left py-3 px-4 font-medium text-gray-600">제출 시간</th>
          <th className="text-left py-3 px-4 font-medium text-gray-600">점수</th>
          <th className="text-left py-3 px-4 font-medium text-gray-600">상태</th>
        </tr></thead>
        <tbody>{submissions.map(s => (
          <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4 font-medium">{s.studentName || s.studentId}</td>
            <td className="py-3 px-4 text-gray-500">{formatDate(s.submittedAt)}</td>
            <td className="py-3 px-4">{s.aiScore !== undefined ? `${s.aiScore}점` : '-'}</td>
            <td className="py-3 px-4">
              <Badge variant={s.status === '채점완료' ? 'success' : 'warning'}>{s.status || '채점대기'}</Badge>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
