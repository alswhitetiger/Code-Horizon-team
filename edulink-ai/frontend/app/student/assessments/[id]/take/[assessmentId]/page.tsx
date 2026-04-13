'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { studentAPI } from '@/lib/api'
import { Assessment } from '@/types'
import AssessmentForm from '@/components/student/AssessmentForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Card from '@/components/ui/Card'

export default function TakeAssessmentPage() {
  const { id: courseId, assessmentId } = useParams<{ id: string; assessmentId: string }>()
  const router = useRouter()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ score?: number; feedback?: string } | null>(null)

  useEffect(() => {
    studentAPI.getAssessment(assessmentId)
      .then((data) => {
        // 이미 제출한 시험이면 결과 화면 표시
        if (data?.submitted) {
          setResult({ score: data.submission?.score, feedback: data.submission?.feedback })
          setSubmitted(true)
        }
        setAssessment(data)
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail || '시험 정보를 불러올 수 없습니다.'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [assessmentId])

  const handleSubmit = async (answers: Record<string, string>) => {
    const res = await studentAPI.submit({ assessment_id: assessmentId, answers })
    setResult(res)
    setSubmitted(true)
  }

  if (loading) return <LoadingSpinner size="lg" />

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={() => router.push(`/student/assessments/${courseId}`)}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              시험 목록으로 돌아가기
            </button>
          </div>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">제출 완료!</h1>
        <Card>
          <div className="text-center py-8 space-y-4">
            <div className="text-5xl">✅</div>
            <p className="text-lg font-medium text-gray-800">답안이 성공적으로 제출되었습니다.</p>
            <p className="text-sm text-gray-500">AI 채점이 진행 중입니다. 잠시 후 시험 목록에서 결과를 확인하세요.</p>
            {result?.score !== undefined && (
              <p className="text-2xl font-bold text-indigo-600">{result.score}점</p>
            )}
            <button
              onClick={() => router.push(`/student/assessments/${courseId}`)}
              className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 text-sm"
            >
              시험 목록으로 돌아가기
            </button>
          </div>
        </Card>
      </div>
    )
  }

  if (!assessment) return null

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push(`/student/assessments/${courseId}`)}
          className="text-sm text-indigo-600 hover:underline mb-2 inline-block"
        >
          ← 시험 목록으로
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
        <p className="text-sm text-gray-500 mt-1">총 {assessment.questions.length}문제</p>
      </div>
      <AssessmentForm
        questions={assessment.questions}
        assessmentId={assessment.id}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
