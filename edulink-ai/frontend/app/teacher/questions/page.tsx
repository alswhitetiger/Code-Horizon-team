'use client'
import { useState } from 'react'
import { teacherAPI } from '@/lib/api'
import { Question } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { mockCourses } from '@/lib/mock-data'
import Link from 'next/link'

type Step = 'form' | 'review' | 'done'
type QuestionType = '객관식' | '단답형' | '서술형'
type Difficulty = '쉬움' | '보통' | '어려움'

const SUBJECTS = ['국어', '수학', '영어', '과학탐구', '사회탐구'] as const
const GRADES = ['중1', '중2', '중3', '고1', '고2', '고3'] as const

type Subject = typeof SUBJECTS[number]
type Grade = typeof GRADES[number]

const TOPICS: Record<Subject, Record<Grade, string[]>> = {
  국어: {
    중1: ['문학 감상 (시)', '문학 감상 (소설)', '문법 (품사)', '읽기와 이해', '쓰기와 표현'],
    중2: ['문학 (현대시)', '문학 (현대소설)', '문법 (문장 성분)', '설득하는 글쓰기', '매체 읽기'],
    중3: ['문학 (고전시가)', '문학 (고전소설)', '문법 (음운과 단어)', '논술과 토론', '매체 언어와 표현'],
    고1: ['문학의 이해', '국어의 역사', '다양한 글 읽기', '화법과 작문 기초', '언어와 매체'],
    고2: ['현대시 심화', '현대소설 심화', '독서와 문법', '화법과 토론', '매체 비평'],
    고3: ['수능 국어 문학', '수능 국어 독서', '수능 국어 언어와 매체', '수능 국어 화법과 작문', 'EBS 연계 문학'],
  },
  수학: {
    중1: ['소인수분해', '정수와 유리수', '문자와 식', '일차방정식', '좌표평면과 그래프', '기본 도형', '평면도형과 입체도형'],
    중2: ['유리수와 순환소수', '식의 계산', '일차부등식', '연립방정식', '일차함수', '도형의 성질', '도형의 닮음', '확률'],
    중3: ['제곱근과 실수', '다항식의 인수분해', '이차방정식', '이차함수', '삼각비', '원의 성질', '통계'],
    고1: ['다항식', '방정식과 부등식', '도형의 방정식', '집합과 명제', '함수', '경우의 수'],
    고2: ['수열', '지수와 로그', '삼각함수', '수열의 극한', '미분'],
    고3: ['적분', '확률과 통계', '미적분 심화', '기하', '수능 수학 유형 분석'],
  },
  영어: {
    중1: ['be동사와 일반동사', '현재진행형', '의문문과 부정문', '명사와 관사', '형용사와 부사'],
    중2: ['과거시제와 미래시제', '조동사', '비교급과 최상급', 'to부정사', '동명사', '접속사'],
    중3: ['현재완료', '수동태', '관계대명사', '분사', '가정법', '간접화법'],
    고1: ['독해 (주제·요지)', '독해 (빈칸 추론)', '독해 (글의 순서·삽입)', '어법·어휘', '영작문 기초'],
    고2: ['장문 독해', '어휘 심화', '영어 듣기 전략', '수능 유형 분석', '독해 전략 심화'],
    고3: ['수능 영어 독해', '수능 영어 듣기', '수능 영어 어법', '수능 영어 어휘', 'EBS 연계 독해'],
  },
  과학탐구: {
    중1: ['과학과 측정', '물질의 상태와 변화', '물질의 성질', '힘과 운동', '빛과 파동', '생물의 다양성', '지구의 구조'],
    중2: ['물질의 구성 (원소·원자)', '전기와 자기', '태양계', '식물의 구조와 기능', '동물의 구조와 기능', '날씨와 기후'],
    중3: ['화학 반응식', '역학적 에너지', '파동과 빛', '세포분열과 유전', '자극과 반응', '생태계와 환경'],
    고1: ['물질의 규칙성', '역학적 시스템', '지구 시스템', '생명 시스템', '화학 변화', '에너지'],
    고2: ['물리학 (역학)', '물리학 (전자기)', '화학 (원소와 주기율표)', '화학 (화학 결합)', '생명과학 (세포와 물질대사)', '생명과학 (유전)', '지구과학 (판 구조론)', '지구과학 (대기와 해양)'],
    고3: ['물리학II (전자기학 심화)', '물리학II (광학)', '화학II (열역학)', '화학II (전기화학)', '생명과학II (세포 신호전달)', '생명과학II (진화)', '지구과학II (우주)', '수능 과탐 유형 분석'],
  },
  사회탐구: {
    중1: ['지리적 특성', '자연환경과 인간 생활', '인문환경', '문화의 다양성'],
    중2: ['정치와 민주주의', '경제생활의 이해', '사회의 변동', '법과 생활'],
    중3: ['사회 불평등', '문화와 다양성', '글로벌 이슈', '정치 제도와 참여'],
    고1: ['행복의 의미', '자연환경과 인간', '생활공간과 사회', '인권과 헌법', '시장 경제와 금융', '민주주의와 정치', '세계화와 평화'],
    고2: ['한국지리', '세계지리', '경제', '정치와 법', '사회·문화', '한국사 (근현대)', '생활과 윤리'],
    고3: ['수능 한국지리', '수능 세계지리', '수능 경제', '수능 정치와 법', '수능 사회·문화', '수능 생활과 윤리', '수능 한국사'],
  },
}

const DIFFICULTY_COLOR: Record<string, string> = {
  쉬움: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
  보통: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
  어려움: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
}
const TYPE_COLOR: Record<string, string> = {
  객관식: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
  단답형: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400',
  서술형: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
}

interface GenForm {
  subject: Subject
  grade_level: Grade
  topic: string
  question_type: QuestionType
  difficulty: Difficulty
  count: number
}

export default function QuestionsPage() {
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState<GenForm>({
    subject: '수학', grade_level: '중1', topic: TOPICS['수학']['중1'][0], question_type: '객관식', difficulty: '보통', count: 3
  })
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Save modal state
  const [assessmentTitle, setAssessmentTitle] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedTitle, setSavedTitle] = useState('')

  // Edit modal state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleSubjectChange = (subject: Subject) => {
    const firstTopic = TOPICS[subject][form.grade_level][0]
    setForm(f => ({ ...f, subject, topic: firstTopic }))
  }

  const handleGradeChange = (grade_level: Grade) => {
    const firstTopic = TOPICS[form.subject][grade_level][0]
    setForm(f => ({ ...f, grade_level, topic: firstTopic }))
  }

  const generate = async () => {
    if (!form.topic) { setError('주제를 선택해주세요'); return }
    setError(''); setLoading(true)
    try {
      const result = await teacherAPI.generateQuestions(form as unknown as Record<string, unknown>)
      const generated: Question[] = (result.questions || []).map((q: Question, i: number) => ({
        ...q, id: q.id || `q-${Date.now()}-${i}`
      }))
      setQuestions(generated)
      setStep('review')
    } catch { setError('문제 생성에 실패했습니다. 다시 시도해주세요.') }
    finally { setLoading(false) }
  }

  const generateMore = async () => {
    if (!form.topic.trim()) return
    setAddLoading(true)
    try {
      const result = await teacherAPI.generateQuestions({ ...form as unknown as Record<string, unknown>, count: 2 })
      const more: Question[] = (result.questions || []).map((q: Question, i: number) => ({
        ...q, id: q.id || `q-${Date.now()}-add-${i}`
      }))
      setQuestions(prev => [...prev, ...more])
    } finally { setAddLoading(false) }
  }

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  const startEdit = (q: Question) => {
    setEditingId(q.id)
    setEditContent(q.content)
  }

  const saveEdit = () => {
    setQuestions(prev => prev.map(q => q.id === editingId ? { ...q, content: editContent } : q))
    setEditingId(null)
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (!assessmentTitle.trim() || !selectedCourse) return
    setSaving(true)
    try {
      await teacherAPI.createAssessment({
        title: assessmentTitle.trim(),
        course_id: selectedCourse,
        questions,
      })
      setSavedTitle(assessmentTitle.trim())
      setStep('done')
    } finally { setSaving(false) }
  }

  // ── 완료 화면 ─────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-12 space-y-4">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">시험이 저장되었습니다!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">"{savedTitle}" 시험이 생성되었습니다.</p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => { setStep('form'); setQuestions([]); setAssessmentTitle(''); setSelectedCourse('') }}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                새 문제 생성
              </button>
              <Link href="/teacher">
                <button className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  대시보드로 이동
                </button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // ── 검토 화면 ─────────────────────────────────────────────
  if (step === 'review') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep('form')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            ← 다시 설정
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">문제 검토</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              불필요한 문제를 삭제하거나 내용을 수정한 후 시험으로 저장하세요.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg font-medium">
              {questions.length}문제 남음
            </span>
          </div>
        </div>

        {/* 문제 카드 목록 */}
        {questions.length === 0 ? (
          <Card>
            <div className="text-center py-10">
              <p className="text-gray-400 dark:text-gray-500 mb-4">모든 문제를 삭제했습니다.</p>
              <button onClick={() => setStep('form')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                처음으로 돌아가기
              </button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const isExpanded = expandedIds.has(q.id)
              const isEditing = editingId === q.id
              return (
                <Card key={q.id}>
                  <div className="flex items-start gap-3">
                    {/* 번호 */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* 배지 + 액션 버튼 */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[q.type]}`}>{q.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLOR[q.difficulty]}`}>{q.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExpand(q.id)}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors"
                          >
                            {isExpanded ? '접기 ▲' : '정답 보기 ▼'}
                          </button>
                          <button
                            onClick={() => startEdit(q)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2 py-1 border border-blue-200 dark:border-blue-700 rounded-lg transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => deleteQuestion(q.id)}
                            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 px-2 py-1 border border-red-200 dark:border-red-700 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            삭제
                          </button>
                        </div>
                      </div>

                      {/* 문제 내용 (수정 모드) */}
                      {isEditing ? (
                        <div className="space-y-2 mb-2">
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            rows={3}
                            className="w-full border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={saveEdit} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors">저장</button>
                            <button onClick={() => setEditingId(null)} className="text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">취소</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">{q.content}</p>
                      )}

                      {/* 객관식 보기 */}
                      {q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                          {q.options.map((opt, j) => (
                            <div key={j} className={`text-xs px-3 py-1.5 rounded-lg border ${
                              isExpanded && opt === q.answer
                                ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium'
                                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                            }`}>
                              {opt} {isExpanded && opt === q.answer && '✓'}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 정답 및 해설 (확장 시) */}
                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 border-t border-gray-100 dark:border-gray-700 pt-2">
                          {!q.options && (
                            <p className="text-sm text-green-700 dark:text-green-400">
                              <span className="font-medium">정답:</span> {q.answer}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium">해설:</span> {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* 하단 액션 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={generateMore}
            disabled={addLoading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-50 transition-colors"
          >
            {addLoading ? (
              <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
            문제 추가 생성
          </button>

          {questions.length > 0 && (
            <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                type="text"
                value={assessmentTitle}
                onChange={e => setAssessmentTitle(e.target.value)}
                placeholder="시험 제목 입력 (예: 1단원 중간 평가)"
                className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">강의 선택</option>
                {mockCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <button
                onClick={handleSave}
                disabled={saving || !assessmentTitle.trim() || !selectedCourse}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {saving ? '저장 중...' : `시험 저장 (${questions.length}문제)`}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── 생성 폼 ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">AI 문제 생성</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">AI가 교육 과정에 맞는 문제를 자동으로 생성합니다.</p>
      </div>

      <Card>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">과목</label>
              <select
                value={form.subject}
                onChange={e => handleSubjectChange(e.target.value as Subject)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">학년</label>
              <select
                value={form.grade_level}
                onChange={e => handleGradeChange(e.target.value as Grade)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">주제 / 단원</label>
              <select
                value={form.topic}
                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TOPICS[form.subject][form.grade_level].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">문제 유형</label>
              <div className="flex gap-2">
                {(['객관식', '단답형', '서술형'] as QuestionType[]).map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, question_type: t }))}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      form.question_type === t
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}>{t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">난이도</label>
              <div className="flex gap-2">
                {(['쉬움', '보통', '어려움'] as Difficulty[]).map(d => (
                  <button key={d} type="button" onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      form.difficulty === d
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}>{d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">문제 수</label>
              <div className="flex gap-2">
                {[3, 5, 8, 10].map(n => (
                  <button key={n} type="button" onClick={() => setForm(f => ({ ...f, count: n }))}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      form.count === n
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}>{n}개
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={generate}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                AI가 문제를 생성하고 있습니다...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI로 문제 생성
              </>
            )}
          </button>
        </div>
      </Card>

      {/* 안내 카드 */}
      <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800">
        <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-2">이용 방법</h3>
        <ol className="text-sm text-indigo-700 dark:text-indigo-400 space-y-1">
          <li>① 과목, 학년, 주제를 선택하고 <strong>AI로 문제 생성</strong>을 클릭하세요.</li>
          <li>② 생성된 문제를 검토하며 불필요한 문제는 <strong>삭제</strong>하고, 내용은 <strong>수정</strong>할 수 있습니다.</li>
          <li>③ 문제를 추가로 생성하거나, 시험 제목과 강의를 선택해 <strong>시험으로 저장</strong>하세요.</li>
        </ol>
      </Card>
    </div>
  )
}
