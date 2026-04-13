'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { teacherAPI } from '@/lib/api'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface Question {
  id: string; type: string; content: string; options?: string[]
  answer: string; explanation: string; difficulty: string
}

interface SubmissionDetail {
  id: string; assessmentId: string; assessmentTitle: string
  questions: Question[]; courseTitle: string
  studentId: string; studentName: string
  answers: Record<string, string>
  aiScore?: number; aiFeedback?: string
  aiDetail?: { strengths: string[]; improvements: string[]; perQuestion: Array<{ questionId: string; score: number; comment: string }> }
  submittedAt: string; status: string
}

export default function GradingDetailPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const router = useRouter()
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [manualScore, setManualScore] = useState('')
  const [manualFeedback, setManualFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    teacherAPI.getSubmission(submissionId)
      .then(data => {
        setSubmission(data)
        setManualScore(data.aiScore !== undefined && data.aiScore !== null ? String(data.aiScore) : '')
        setManualFeedback(data.aiFeedback || '')
      })
      .catch(() => setError('제출 정보를 불러올 수 없습니다.'))
      .finally(() => setLoading(false))
  }, [submissionId])

  const handleSave = async () => {
    if (!submission) return
    setSaving(true)
    try {
      await teacherAPI.gradeSubmission(submissionId, { score: Number(manualScore), feedback: manualFeedback })
      setSaved(true)
      setTimeout(() => router.push('/teacher/grading'), 1200)
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !submission) return (
    <Card>
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{error || '제출 정보를 찾을 수 없습니다.'}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-indigo-600 hover:underline">← 돌아가기</button>
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/teacher/grading')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
        ← 채점 목록
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{submission.studentName}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {submission.assessmentTitle} · {submission.courseTitle} · {submission.submittedAt.slice(0, 10)}
          </p>
        </div>
        <Badge variant={submission.status === '채점완료' ? 'success' : 'warning'} className="w-fit">
          {submission.status}
        </Badge>
      </div>

      {submission.aiScore !== undefined && submission.aiScore !== null && (
        <Card>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">AI 채점 결과</h2>
          <div className="flex items-center gap-4 mb-3">
            <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{submission.aiScore}점</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div className={`h-3 rounded-full transition-all ${submission.aiScore >= 80 ? 'bg-green-500' : submission.aiScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${submission.aiScore}%` }} />
              </div>
            </div>
          </div>
          {submission.aiFeedback && (
            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">{submission.aiFeedback}</p>
          )}
          {submission.aiDetail && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {submission.aiDetail.strengths.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">잘한 점</p>
                  {submission.aiDetail.strengths.map((s, i) => <p key={i} className="text-xs text-green-600 dark:text-green-300">• {s}</p>)}
                </div>
              )}
              {submission.aiDetail.improvements.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">개선할 점</p>
                  {submission.aiDetail.improvements.map((s, i) => <p key={i} className="text-xs text-amber-600 dark:text-amber-300">• {s}</p>)}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {submission.questions.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">문제별 답안 확인</h2>
          <div className="space-y-5">
            {submission.questions.map((q, idx) => {
              const studentAnswer = submission.answers[q.id] || ''
              const perQ = submission.aiDetail?.perQuestion?.find(p => p.questionId === q.id)
              const isCorrect = q.options ? studentAnswer.trim() === q.answer.trim() : null
              return (
                <div key={q.id} className={`border rounded-xl p-4 ${
                  isCorrect === true ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' :
                  isCorrect === false ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' :
                  'border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">문제 {idx + 1}</span>
                      <span className="text-xs text-gray-400">{q.type} · {q.difficulty}</span>
                    </div>
                    {perQ && <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{perQ.score}점</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">{q.content}</p>
                  {q.options && (
                    <div className="grid grid-cols-2 gap-1.5 mb-3">
                      {q.options.map(opt => (
                        <div key={opt} className={`text-xs px-3 py-1.5 rounded-lg border ${
                          opt.trim() === q.answer.trim() ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium' :
                          opt.trim() === studentAnswer.trim() ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                          'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
                          {opt}{opt.trim() === q.answer.trim() && ' ✓'}{opt.trim() === studentAnswer.trim() && opt.trim() !== q.answer.trim() && ' ✗'}
                        </div>
                      ))}
                    </div>
                  )}
                  {!q.options && (
                    <div className="space-y-2 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">학생 답안</p>
                        <p className="text-sm p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">{studentAnswer || '(미입력)'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">모범 답안</p>
                        <p className="text-sm p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">{q.answer}</p>
                      </div>
                    </div>
                  )}
                  {perQ?.comment && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">💬 {perQ.comment}</p>}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">교사 채점</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">최종 점수 (0~100)</label>
            <input type="number" min="0" max="100" value={manualScore} onChange={e => setManualScore(e.target.value)}
              className="w-32 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0~100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">피드백</label>
            <textarea value={manualFeedback} onChange={e => setManualFeedback(e.target.value)} rows={4}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="학생에게 전달할 피드백..." />
          </div>
          {saved ? (
            <p className="text-green-600 dark:text-green-400 font-medium">✓ 채점이 저장되었습니다. 목록으로 돌아갑니다...</p>
          ) : (
            <button onClick={handleSave} disabled={saving || !manualScore}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? '저장 중...' : '채점 완료'}
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}
