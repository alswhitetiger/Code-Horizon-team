'use client'
import { useState } from 'react'
import { teacherAPI } from '@/lib/api'
import { Question } from '@/types'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Props { onSave?: (questions: Question[]) => void }

export default function QuestionGenerator({ onSave }: Props) {
  const [form, setForm] = useState({
    subject: '수학', grade_level: '중1', topic: '', question_type: '객관식',
    difficulty: '보통', count: 3
  })
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    if (!form.topic) { setError('주제를 입력해주세요'); return }
    setError(''); setLoading(true)
    try {
      const result = await teacherAPI.generateQuestions(form)
      setQuestions(result.questions || [])
    } catch { setError('문제 생성에 실패했습니다.') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: '과목', key: 'subject', type: 'text', placeholder: '예: 수학' },
          { label: '학년/수준', key: 'grade_level', type: 'text', placeholder: '예: 중1' },
          { label: '주제', key: 'topic', type: 'text', placeholder: '예: 분수의 덧셈' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input type={type} value={(form as Record<string, string | number>)[key] as string} placeholder={placeholder}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">문제 유형</label>
          <select value={form.question_type} onChange={e => setForm(f => ({ ...f, question_type: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
            <option>객관식</option><option>단답형</option><option>서술형</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
          <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
            <option>쉬움</option><option>보통</option><option>어려움</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">문제 수</label>
          <input type="number" min={1} max={10} value={form.count}
            onChange={e => setForm(f => ({ ...f, count: +e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button onClick={generate} disabled={loading} className="w-full">
        {loading ? '생성 중...' : 'AI로 생성'}
      </Button>
      {loading && <LoadingSpinner />}
      {questions.length > 0 && (
        <div className="mt-4 space-y-4">
          <h3 className="font-semibold text-gray-800">생성된 문제 ({questions.length}개)</h3>
          {questions.map((q, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="font-medium text-sm mb-2">{i + 1}. {q.content}</p>
              {q.options && <ul className="text-sm text-gray-600 space-y-1 mb-2">{q.options.map((o, j) => <li key={j}>{o}</li>)}</ul>}
              <p className="text-sm text-green-700">정답: {q.answer}</p>
              <p className="text-xs text-gray-500 mt-1">{q.explanation}</p>
            </div>
          ))}
          {onSave && <Button variant="secondary" onClick={() => onSave(questions)} className="w-full">저장하기</Button>}
        </div>
      )}
    </div>
  )
}
