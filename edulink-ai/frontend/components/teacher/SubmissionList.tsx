'use client'
import { Submission } from '@/types'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Props { submissions: Submission[] }

export default function SubmissionList({ submissions }: Props) {
  if (!submissions.length) return <p className="text-gray-500 text-sm text-center py-8">제출된 답안이 없습니다.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-200 dark:border-gray-700">
          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">학생명</th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">제출 시간</th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">점수</th>
          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">상태</th>
          <th className="py-3 px-4" />
        </tr></thead>
        <tbody>{submissions.map(s => (
          <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{s.studentName || s.studentId}</td>
            <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{formatDate(s.submittedAt)}</td>
            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{s.aiScore !== undefined ? `${s.aiScore}점` : '-'}</td>
            <td className="py-3 px-4">
              <Badge variant={s.status === '채점완료' ? 'success' : 'warning'}>{s.status || '채점대기'}</Badge>
            </td>
            <td className="py-3 px-4 text-right">
              <Link href={`/teacher/grading/${s.id}`}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                {s.status === '채점완료' ? '상세보기' : '채점하기'} →
              </Link>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
