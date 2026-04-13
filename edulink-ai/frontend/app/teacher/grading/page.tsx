'use client'
import { useEffect, useState } from 'react'
import { teacherAPI } from '@/lib/api'
import { Submission } from '@/types'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
type Filter = 'all' | '채점대기' | '채점완료'

export default function GradingPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.getAllSubmissions()
      .then(setSubmissions)
      .finally(() => setLoading(false))
  }, [])

  const filtered = submissions.filter(s =>
    filter === 'all' ? true : (s.status || '채점대기') === filter
  )

  const pendingCount = submissions.filter(s => (s.status || '채점대기') === '채점대기').length
  const doneCount = submissions.filter(s => s.status === '채점완료').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          ← 대시보드
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">채점 관리</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">학생들의 제출 답안을 확인하고 채점하세요.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center py-4">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{submissions.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">전체 제출</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-3xl font-bold text-amber-500">{pendingCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">채점 대기</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-3xl font-bold text-green-500">{doneCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">채점 완료</p>
        </Card>
      </div>

      <Card>
        {/* 필터 */}
        <div className="flex gap-2 mb-5">
          {(['all', '채점대기', '채점완료'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}>
              {f === 'all' ? `전체 (${submissions.length})` : f === '채점대기' ? `채점대기 (${pendingCount})` : `채점완료 (${doneCount})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-10">제출된 답안이 없습니다.</p>
        ) : (
          <>
            {/* 데스크톱 테이블 */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-3 px-3 font-semibold text-gray-600 dark:text-gray-400">학생명</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600 dark:text-gray-400">시험명</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600 dark:text-gray-400">강의</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600 dark:text-gray-400">제출 시간</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600 dark:text-gray-400">AI 점수</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600 dark:text-gray-400">상태</th>
                    <th className="py-3 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-3 font-medium text-gray-900 dark:text-gray-100">{s.studentName || s.studentId}</td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{s.assessmentTitle || s.assessmentId}</td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400 text-xs">{s.courseTitle || ''}</td>
                      <td className="py-3 px-3 text-gray-400 dark:text-gray-500">{s.submittedAt.slice(0, 10)}</td>
                      <td className="py-3 px-3 font-medium">{s.aiScore !== undefined ? `${s.aiScore}점` : '-'}</td>
                      <td className="py-3 px-3">
                        <Badge variant={(s.status || '채점대기') === '채점완료' ? 'success' : 'warning'}>
                          {s.status || '채점대기'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link href={`/teacher/grading/${s.id}`}
                          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-3 py-1 border border-indigo-200 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                          {(s.status || '채점대기') === '채점대기' ? '채점하기' : '상세보기'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일 카드 */}
            <div className="sm:hidden space-y-3">
              {filtered.map(s => (
                <Link key={s.id} href={`/teacher/grading/${s.id}`}>
                  <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{s.studentName || s.studentId}</p>
                      <Badge variant={(s.status || '채점대기') === '채점완료' ? 'success' : 'warning'}>
                        {s.status || '채점대기'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{s.assessmentTitle || s.assessmentId}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">{s.submittedAt.slice(0, 10)}</p>
                      {s.aiScore !== undefined && <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">AI 점수: {s.aiScore}점</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
