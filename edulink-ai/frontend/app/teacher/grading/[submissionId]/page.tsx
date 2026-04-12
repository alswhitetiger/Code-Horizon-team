'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { teacherAPI } from '@/lib/api'
import { Submission } from '@/types'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { mockSubmissions, mockAssessments } from '@/lib/mock-data'

export default function GradingDetailPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [manualScore, setManualScore] = useState('')
  const [manualFeedback, setManualFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Mock fallback
    const found = mockSubmissions.find(s => s.id === submissionId) || null
    setSubmission(found)
    if (found) {
      setManualScore(found.aiScore !== undefined ? String(found.aiScore) : '')
      setManualFeedback(found.aiFeedback || '')
    }
    setLoading(false)
  }, [submissionId])

  const assessment = submission ? mockAssessments.find(a => a.id === submission.assessmentId) : null

  const handleSave = async () => {
    if (!submission) return
    setSaving(true)
    try {
      await teacherAPI.gradeSubmission(submissionId, {
        score: Number(manualScore),
        feedback: manualFeedback,
      })
      setSaved(true)
      setTimeout(() => {
        router.push('/teacher/grading')
      }, 1200)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!submission) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">제출 정보를 찾을 수 없습니다.</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-indigo-600 hover:underline">← 돌아가기</button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/teacher/grading')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          ← 채점 목록
        </button>
      </div>

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{submission.studentName || submission.studentId}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {assessment?.title || submission.assessmentId} · {submission.submittedAt.slice(0, 10)}
          </p>
        </div>
        <Badge variant={(submission.status || '채점대기') === '채점완료' ? 'success' : 'warning'} className="w-fit">
          {submission.status || '채점대기'}
        </Badge>
      </div>

      {/* AI 채점 요약 */}
      {submission.aiScore !== undefined && (
        <Card>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">AI 채점 결과</h2>
          <div className="flex items-center gap-4 mb-3">
            <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{submission.aiScore}점</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${submission.aiScore >= 80 ? 'bg-green-500' : submission.aiScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${submission.aiScore}%` }}
                />
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
                  <ul className="space-y-0.5">
                    {submission.aiDetail.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-green-600 dark:text-green-300">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {submission.aiDetail.improvements.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">개선할 점</p>
                  <ul className="space-y-0.5">
                    {submission.aiDetail.improvements.map((s, i) => (
                      <li key={i} className="text-xs text-amber-600 dark:text-amber-300">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* 문제별 답안 */}
      {assessment && (
        <Card>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">문제별 답안 확인</h2>
          <div className="space-y-5">
            {assessment.questions.map((q, idx) => {
              const studentAnswer = submission.answers[q.id] || ''
              const perQ = submission.aiDetail?.perQuestion?.find(p => p.questionId === q.id)
              const isCorrect = q.type === '객관식' ? studentAnswer === q.answer : null
              return (
                <div key={q.id} className={`border rounded-xl p-4 ${
                  isCorrect === true ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' :
                  isCorrect === false ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' :
                  'border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                        문제 {idx + 1}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        q.difficulty === '쉬움' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' :
                        q.difficulty === '어려움' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' :
                        'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400'
                      }`}>{q.difficulty}</span>
                      <span className="text-xs text-gray-400">{q.type}</span>
                    </div>
                    {perQ && <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{perQ.score}점</span>}
                  </div>

                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">{q.content}</p>

                  {/* 객관식 선택지 */}
                  {q.options && (
                    <div className="grid grid-cols-2 gap-1.5 mb-3">
                      {q.options.map(opt => (
                        <div key={opt} className={`text-xs px-3 py-1.5 rounded-lg border ${
                          opt === q.answer ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium' :
                          opt === studentAnswer && opt !== q.answer ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                          'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                        }`}>
                          {opt}
                          {opt === q.answer && ' ✓'}
                          {opt === studentAnswer && opt !== q.answer && ' ✗'}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 주관식 답안 */}
                  {!q.options && (
                    <div className="mb-3 space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">학생 답안</p>
                        <p className={`text-sm p-2 rounded-lg border ${studentAnswer ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-700 text-gray-400 italic'}`}>
                          {studentAnswer || '(미입력)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">모범 답안</p>
                        <p className="text-sm p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">{q.answer}</p>
                      </div>
                    </div>
                  )}

                  {perQ?.comment && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pl-1">💬 {perQ.comment}</p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* 교사 수동 채점 */}
      <Card>
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">교사 채점</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">최종 점수 (0~100)</label>
            <input
              type="number" min="0" max="100"
              value={manualScore}
              onChange={e => setManualScore(e.target.value)}
              className="w-32 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0~100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">피드백</label>
            <textarea
              value={manualFeedback}
              onChange={e => setManualFeedback(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="학생에게 전달할 피드백을 입력하세요..."
            />
          </div>
          {saved ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              채점이 저장되었습니다. 목록으로 돌아갑니다...
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || !manualScore}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '저장 중...' : '채점 완료'}
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}
