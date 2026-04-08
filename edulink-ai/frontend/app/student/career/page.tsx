'use client'
import { useEffect, useState, useRef } from 'react'
import { careerAPI } from '@/lib/api'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

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

type Tab = 'goal' | 'guidance' | 'chat'

export default function CareerPage() {
  const [tab, setTab] = useState<Tab>('goal')
  const [careerName, setCareerName] = useState('')
  const [reason, setReason] = useState('')
  const [savedCareer, setSavedCareer] = useState<{ careerName: string; reason?: string } | null>(null)
  const [guidance, setGuidance] = useState<CareerGuidance | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
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

  const TABS: { key: Tab; label: string }[] = [
    { key: 'goal', label: '꿈 설정' },
    { key: 'guidance', label: '진로 안내' },
    { key: 'chat', label: 'AI 상담' },
  ]

  if (pageLoading) return <LoadingSpinner size="lg" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">나의 진로</h1>
        <p className="text-sm text-gray-500 mt-1">
          {savedCareer ? `목표: ${savedCareer.careerName}` : '꿈을 설정하고 AI와 함께 준비하세요!'}
        </p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => {
              if (t.key === 'guidance') handleLoadGuidance()
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
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이 직업을 꿈꾸는 이유</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="왜 이 직업을 꿈꾸나요? 어떤 계기가 있었나요?"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">필요 역량</h3>
                  <div className="flex flex-wrap gap-2">
                    {guidance.required_skills.map((s, i) => (
                      <Badge key={i} variant="info">{s}</Badge>
                    ))}
                  </div>
                </Card>
                <Card>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">관련 학교 과목</h3>
                  <div className="flex flex-wrap gap-2">
                    {guidance.related_subjects.map((s, i) => (
                      <Badge key={i} variant="success">{s}</Badge>
                    ))}
                  </div>
                </Card>
                <Card>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">관련 대학 전공</h3>
                  <div className="flex flex-wrap gap-2">
                    {guidance.related_majors.map((s, i) => (
                      <Badge key={i} variant="warning">{s}</Badge>
                    ))}
                  </div>
                </Card>
                {guidance.certifications.length > 0 && (
                  <Card>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">관련 자격증 / 시험</h3>
                    <div className="flex flex-wrap gap-2">
                      {guidance.certifications.map((s, i) => (
                        <Badge key={i} variant="danger">{s}</Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              <Card>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">단계별 로드맵</h3>
                <ol className="space-y-2">
                  {guidance.roadmap.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
                    </li>
                  ))}
                </ol>
              </Card>

              <Card className="bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800">
                <p className="text-indigo-700 dark:text-indigo-300 font-medium text-sm">{guidance.encouragement}</p>
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
              <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
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
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
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
              className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button onClick={handleSendMessage} disabled={!input.trim() || loading}>전송</Button>
          </div>
        </Card>
      )}

    </div>
  )
}
