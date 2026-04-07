'use client'
import { useEffect, useState } from 'react'
import { careerAPI } from '@/lib/api'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface StudentCareer {
  studentId: string
  studentName: string
  careerName: string | null
  reason: string | null
}

interface GeneratedQuestion {
  type: string
  content: string
  options: string[] | null
  answer: string
  explanation: string
  career_relevance: string
}

export default function TeacherCareerPage() {
  const [students, setStudents] = useState<StudentCareer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCareer, setSelectedCareer] = useState('')
  const [subject, setSubject] = useState('')
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [generating, setGenerating] = useState(false)
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  useEffect(() => {
    careerAPI.getStudentsCareers()
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }, [])

  // 진로별 학생 그룹화
  const careerGroups = students.reduce<Record<string, StudentCareer[]>>((acc, s) => {
    const key = s.careerName || '미설정'
    acc[key] = [...(acc[key] || []), s]
    return acc
  }, {})

  const hasGoal = students.filter(s => s.careerName)
  const noGoal = students.filter(s => !s.careerName)

  const handleGenerateQuestions = async () => {
    if (!selectedCareer.trim()) return
    setGenerating(true)
    setGeneratedQuestions([])
    try {
      const res = await careerAPI.teacherGenerateQuestions(selectedCareer, subject || undefined, 5)
      setGeneratedQuestions(res.questions)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">학생 진로 현황</h1>
        <p className="text-sm text-gray-500 mt-1">학생들의 진로 목표를 파악하고 맞춤 수업을 준비하세요.</p>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-indigo-600">{students.length}</p>
          <p className="text-sm text-gray-500 mt-1">전체 학생</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">{hasGoal.length}</p>
          <p className="text-sm text-gray-500 mt-1">진로 설정 완료</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-orange-500">{noGoal.length}</p>
          <p className="text-sm text-gray-500 mt-1">진로 미설정</p>
        </Card>
      </div>

      {/* 진로별 학생 그룹 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">진로별 학생 현황</h2>
        {Object.keys(careerGroups).length === 0 ? (
          <Card><p className="text-center text-gray-400 py-8">등록된 학생이 없습니다.</p></Card>
        ) : (
          <div className="space-y-3">
            {Object.entries(careerGroups).sort(([a], [b]) => (a === '미설정' ? 1 : b === '미설정' ? -1 : 0)).map(([career, group]) => (
              <Card key={career}>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedStudent(expandedStudent === career ? null : career)}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={career === '미설정' ? 'danger' : 'info'}>{career}</Badge>
                    <span className="text-sm text-gray-500">{group.length}명</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {career !== '미설정' && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setSelectedCareer(career)
                          document.getElementById('question-generator')?.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        문제 생성
                      </button>
                    )}
                    <span className="text-gray-400 text-sm">{expandedStudent === career ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expandedStudent === career && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    {group.map(s => (
                      <div key={s.studentId} className="flex items-start gap-3 text-sm">
                        <span className="font-medium text-gray-800 w-20 shrink-0">{s.studentName}</span>
                        {s.reason ? (
                          <span className="text-gray-500">"{s.reason}"</span>
                        ) : (
                          <span className="text-gray-400 italic">이유 미입력</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 진로 연계 문제 생성기 */}
      <div id="question-generator">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">진로 연계 수업 문제 생성</h2>
        <Card>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">희망 직업 *</label>
                <input
                  type="text"
                  value={selectedCareer}
                  onChange={e => setSelectedCareer(e.target.value)}
                  placeholder="예: 의사, 소프트웨어 엔지니어"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연계 과목 (선택)</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="예: 수학, 생명과학, 정보"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <Button
              onClick={handleGenerateQuestions}
              disabled={!selectedCareer.trim() || generating}
              className="w-full"
            >
              {generating ? 'AI 문제 생성 중...' : '진로 연계 문제 생성 (5문제)'}
            </Button>
          </div>

          {generating && (
            <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>
          )}

          {generatedQuestions.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">
                  {selectedCareer} 연계 문제 ({subject && `${subject} 과목`})
                </h3>
                <button
                  onClick={() => {
                    const text = generatedQuestions.map((q, i) =>
                      `Q${i+1}. [${q.type}] ${q.content}\n정답: ${q.answer}\n해설: ${q.explanation}\n진로연계: ${q.career_relevance}`
                    ).join('\n\n')
                    navigator.clipboard.writeText(text)
                    alert('문제가 클립보드에 복사되었습니다.')
                  }}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  전체 복사
                </button>
              </div>
              {generatedQuestions.map((q, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={q.type === '객관식' ? 'info' : q.type === '단답형' ? 'success' : 'warning'}>
                      {q.type}
                    </Badge>
                    <span className="text-xs text-gray-400">Q{i + 1}</span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{q.content}</p>
                  {q.options && (
                    <ul className="text-sm text-gray-600 space-y-1 pl-2">
                      {q.options.map((opt, j) => (
                        <li key={j} className={opt === q.answer ? 'text-green-700 font-medium' : ''}>
                          {j + 1}. {opt}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="bg-green-50 p-2 rounded-lg text-xs space-y-1">
                    <p className="text-green-800 font-medium">정답: {q.answer}</p>
                    <p className="text-green-700">{q.explanation}</p>
                    <p className="text-green-500">{q.career_relevance}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
