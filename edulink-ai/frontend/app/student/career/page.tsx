'use client'
import { useEffect, useState, useRef } from 'react'
import { careerAPI } from '@/lib/api'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface CareerGuidance {
  overview: string
  required_skills: string[]
  related_subjects: string[]
  related_majors: string[]
  certifications: string[]
  roadmap: string[]
  encouragement: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface CareerQuestion {
  type: string
  content: string
  options: string[] | null
  answer: string
  explanation: string
  career_relevance: string
}

type Tab = 'goal' | 'guidance' | 'chat' | 'questions'

export default function CareerPage() {
  const [tab, setTab] = useState<Tab>('goal')
  const [careerName, setCareerName] = useState('')
  const [reason, setReason] = useState('')
  const [savedCareer, setSavedCareer] = useState<{ careerName: string; reason?: string } | null>(null)
  const [guidance, setGuidance] = useState<CareerGuidance | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [questions, setQuestions] = useState<CareerQuestion[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    careerAPI.getGoal()
      .then(goal => {
        if (goal) {
          setSavedCareer(goal)
          setCareerName(goal.careerName)
          setReason(goal.reason || '')
        }
      })
      .catch(() => {})
      .finally(() => setPageLoading(false))
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSaveGoal = async () => {
    if (!careerName.trim()) return
    setSaving(true)
    try {
      await careerAPI.setGoal(careerName.trim(), reason.trim())
      setSavedCareer({ careerName: careerName.trim(), reason: reason.trim() })
      setTab('guidance')
    } finally {
      setSaving(false)
    }
  }

  const handleLoadGuidance = async () => {
    if (guidance) { setTab('guidance'); return }
    setLoading(true)
    try {
      const res = await careerAPI.getGuidance()
      setGuidance(res.guidance)
    } catch {
      alert('진로 목표를 먼저 설정해주세요.')
      setTab('goal')
    } finally {
      setLoading(false)
    }
    setTab('guidance')
  }

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    setLoading(true)
    try {
      const res = await careerAPI.chat(input.trim(), messages)
      setMessages([...newHistory, { role: 'assistant', content: res.reply }])
    } catch {
      setMessages([...newHistory, { role: 'assistant', content: '죄송합니다. 잠시 후 다시 시도해주세요.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleLoadQuestions = async () => {
    if (questions.length > 0) { setTab('questions'); return }
    if (!savedCareer) { alert('진로 목표를 먼저 설정해주세요.'); setTab('goal'); return }
    setLoading(true)
    try {
      const res = await careerAPI.getQuestions(savedCareer.careerName, undefined, 5)
      setQuestions(res.questions)
      setSelectedAnswers({})
      setRevealedAnswers({})
    } finally {
      setLoading(false)
    }
    setTab('questions')
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'goal', label: '꿈 설정' },
    { key: 'guidance', label: '진로 안내' },
    { key: 'chat', label: 'AI 상담' },
    { key: 'questions', label: '예상 문제' },
  ]

  if (pageLoading) return <LoadingSpinner size="lg" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">나의 진로</h1>
        <p className="text-sm text-gray-500 mt-1">
          {savedCareer ? `목표: ${savedCareer.careerName}` : '꿈을 설정하고 AI와 함께 준비하세요!'}
        </p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => {
              if (t.key === 'guidance') handleLoadGuidance()
              else if (t.key === 'questions') handleLoadQuestions()
              else setTab(t.key)
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 꿈 설정 탭 */}
      {tab === 'goal' && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">나의 꿈 설정</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">희망 직업 *</label>
              <input
                type="text"
                value={careerName}
                onChange={e => setCareerName(e.target.value)}
                placeholder="예: 의사, 소프트웨어 엔지니어, 교사, 건축가..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이 직업을 꿈꾸는 이유</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="왜 이 직업을 꿈꾸나요? 어떤 계기가 있었나요?"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
            <Button onClick={handleSaveGoal} disabled={!careerName.trim() || saving} className="w-full">
              {saving ? '저장 중...' : '꿈 저장하고 안내 받기'}
            </Button>
          </div>
        </Card>
      )}

      {/* 진로 안내 탭 */}
      {tab === 'guidance' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : guidance ? (
            <>
              <Card>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{savedCareer?.careerName} 란?</h2>
                <p className="text-gray-600 text-sm">{guidance.overview}</p>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <h3 className="font-semibold text-gray-800 mb-3">필요 역량</h3>
                  <div className="flex flex-wrap gap-2">
                    {guidance.required_skills.map((s, i) => (
                      <Badge key={i} variant="info">{s}</Badge>
                    ))}
                  </div>
                </Card>
                <Card>
                  <h3 className="font-semibold text-gray-800 mb-3">관련 학교 과목</h3>
                  <div className="flex flex-wrap gap-2">
                    {guidance.related_subjects.map((s, i) => (
                      <Badge key={i} variant="success">{s}</Badge>
                    ))}
                  </div>
                </Card>
                <Card>
                  <h3 className="font-semibold text-gray-800 mb-3">관련 대학 전공</h3>
                  <div className="flex flex-wrap gap-2">
                    {guidance.related_majors.map((s, i) => (
                      <Badge key={i} variant="warning">{s}</Badge>
                    ))}
                  </div>
                </Card>
                {guidance.certifications.length > 0 && (
                  <Card>
                    <h3 className="font-semibold text-gray-800 mb-3">관련 자격증 / 시험</h3>
                    <div className="flex flex-wrap gap-2">
                      {guidance.certifications.map((s, i) => (
                        <Badge key={i} variant="danger">{s}</Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              <Card>
                <h3 className="font-semibold text-gray-800 mb-3">단계별 로드맵</h3>
                <ol className="space-y-2">
                  {guidance.roadmap.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-sm text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </Card>

              <Card className="bg-indigo-50 border-indigo-200">
                <p className="text-indigo-700 font-medium text-sm">{guidance.encouragement}</p>
              </Card>

              <Button onClick={() => { setGuidance(null); setTab('guidance'); handleLoadGuidance() }} variant="secondary" className="w-full">
                AI 안내 다시 생성
              </Button>
            </>
          ) : null}
        </div>
      )}

      {/* AI 상담 채팅 탭 */}
      {tab === 'chat' && (
        <Card className="flex flex-col" style={{ height: '560px' }}>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-8">
                <p className="text-2xl mb-2">💬</p>
                {savedCareer
                  ? `${savedCareer.careerName}에 대해 무엇이든 물어보세요!`
                  : '진로 목표를 먼저 설정하면 더 맞춤화된 상담을 받을 수 있어요.'}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2 border-t border-gray-100 pt-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="진로에 대해 궁금한 것을 물어보세요..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button onClick={handleSendMessage} disabled={!input.trim() || loading}>전송</Button>
          </div>
        </Card>
      )}

      {/* 예상 문제 탭 */}
      {tab === 'questions' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : questions.length > 0 ? (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{savedCareer?.careerName} 관련 예상 문제 {questions.length}개</p>
                <button
                  onClick={() => { setQuestions([]); handleLoadQuestions() }}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  새 문제 생성
                </button>
              </div>
              {questions.map((q, i) => (
                <Card key={i}>
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={q.type === '객관식' ? 'info' : q.type === '단답형' ? 'success' : 'warning'}>
                      {q.type}
                    </Badge>
                    <span className="text-xs text-gray-400">Q{i + 1}</span>
                  </div>
                  <p className="font-medium text-gray-900 mb-3">{q.content}</p>

                  {q.options ? (
                    <div className="space-y-2 mb-3">
                      {q.options.map((opt, j) => (
                        <label key={j} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${
                          selectedAnswers[i] === opt
                            ? revealedAnswers[i]
                              ? opt === q.answer ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50'
                              : 'border-indigo-500 bg-indigo-50'
                            : revealedAnswers[i] && opt === q.answer
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <input
                            type="radio"
                            name={`q-${i}`}
                            value={opt}
                            checked={selectedAnswers[i] === opt}
                            onChange={() => setSelectedAnswers(a => ({ ...a, [i]: opt }))}
                            disabled={revealedAnswers[i]}
                            className="text-indigo-600"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={selectedAnswers[i] || ''}
                      onChange={e => setSelectedAnswers(a => ({ ...a, [i]: e.target.value }))}
                      disabled={revealedAnswers[i]}
                      placeholder="답변을 입력하세요..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                    />
                  )}

                  {!revealedAnswers[i] ? (
                    <button
                      onClick={() => setRevealedAnswers(r => ({ ...r, [i]: true }))}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      정답 및 해설 보기
                    </button>
                  ) : (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm space-y-1">
                      <p className="font-medium text-blue-800">정답: {q.answer}</p>
                      <p className="text-blue-700">{q.explanation}</p>
                      <p className="text-blue-500 text-xs">{q.career_relevance}</p>
                    </div>
                  )}
                </Card>
              ))}
            </>
          ) : (
            <Card>
              <p className="text-center text-gray-500 py-8">진로 목표를 설정하면 예상 문제를 받을 수 있어요.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
