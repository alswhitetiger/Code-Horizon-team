'use client'
import { useState } from 'react'
import { Question } from '@/types'
import Button from '@/components/ui/Button'

interface Props {
  questions: Question[]
  assessmentId: string
  onSubmit: (answers: Record<string, string>) => Promise<void>
}

export default function AssessmentForm({ questions, assessmentId, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  void assessmentId

  // 안정적인 key 생성: q.id가 있으면 사용, 없으면 인덱스 기반 fallback
  const getKey = (q: Question, i: number) => q.id || `q_${i}`

  const handleSubmit = async () => {
    setLoading(true)
    try { await onSubmit(answers) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      {questions.map((q, i) => {
        const key = getKey(q, i)
        return (
          <div key={key} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                {q.type}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                q.difficulty === '쉬움' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' :
                q.difficulty === '어려움' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' :
                'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400'
              }`}>{q.difficulty}</span>
            </div>
            <p className="font-medium mb-4 text-gray-900 dark:text-gray-100">{i + 1}. {q.content}</p>
            {q.options ? (
              <div className="space-y-2">
                {q.options.map((opt, j) => (
                  <label key={j} className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${
                    answers[key] === opt
                      ? 'bg-indigo-50 dark:bg-indigo-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}>
                    <input
                      type="radio"
                      name={`radio_${key}`}
                      value={opt}
                      checked={answers[key] === opt}
                      onChange={() => setAnswers(a => ({ ...a, [key]: opt }))}
                      className="text-indigo-600 accent-indigo-600"
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200">{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[key] || ''}
                onChange={e => setAnswers(a => ({ ...a, [key]: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={4}
                placeholder="답변을 입력하세요..."
              />
            )}
          </div>
        )
      })}
      <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">
        {loading ? '제출 중...' : '제출하기'}
      </Button>
    </div>
  )
}
