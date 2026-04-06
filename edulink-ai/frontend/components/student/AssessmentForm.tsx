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

  const handleSubmit = async () => {
    setLoading(true)
    try { await onSubmit(answers) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      {questions.map((q, i) => (
        <div key={q.id || i} className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="font-medium mb-4">{i + 1}. {q.content}</p>
          {q.options ? (
            <div className="space-y-2">
              {q.options.map((opt, j) => (
                <label key={j} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name={`q-${q.id || i}`} value={opt}
                    checked={answers[q.id || `q${i}`] === opt}
                    onChange={() => setAnswers(a => ({ ...a, [q.id || `q${i}`]: opt }))}
                    className="text-indigo-600" />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea value={answers[q.id || `q${i}`] || ''}
              onChange={e => setAnswers(a => ({ ...a, [q.id || `q${i}`]: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4} placeholder="답변을 입력하세요..." />
          )}
        </div>
      ))}
      <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">
        {loading ? '제출 중...' : '제출하기'}
      </Button>
    </div>
  )
}
