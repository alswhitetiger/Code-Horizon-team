'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { studentAPI } from '@/lib/api'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function AssessmentsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [assessments, setAssessments] = useState<Array<{
    id: string;
    title: string;
    questionCount: number;
    submitted: boolean;
    score?: number;
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    studentAPI.getAssessments(id)
      .then(setAssessments)
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">시험 목록</h1>
      {assessments.length === 0 ? (
        <Card><p className="text-gray-500 dark:text-gray-400 text-center py-8">등록된 시험이 없습니다.</p></Card>
      ) : (
        <div className="space-y-4">
          {assessments.map((a) => (
            <Card key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{a.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {a.questionCount}문제 · {a.submitted ? `점수: ${a.score}점` : '미제출'}
                </p>
              </div>
              {!a.submitted && (
                <button onClick={() => router.push(`/student/assessments/${id}/take/${a.id}`)}
                  className="w-full sm:w-auto text-sm bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors">
                  시험 시작
                </button>
              )}
              {a.submitted && <span className="text-sm text-green-600 dark:text-green-400 font-medium">완료</span>}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
