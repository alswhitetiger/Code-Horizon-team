'use client'
import { useState } from 'react'
import { teacherAPI } from '@/lib/api'
import { Question } from '@/types'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Props { onSave?: (questions: Question[]) => void }

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

export default function QuestionGenerator({ onSave }: Props) {
  const [form, setForm] = useState({
    subject: '수학' as Subject,
    grade_level: '중1' as Grade,
    topic: TOPICS['수학']['중1'][0],
    question_type: '객관식',
    difficulty: '보통',
    count: 3
  })
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      const result = await teacherAPI.generateQuestions(form)
      setQuestions(result.questions || [])
    } catch { setError('문제 생성에 실패했습니다.') }
    finally { setLoading(false) }
  }

  const selectClass = "w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">과목</label>
          <select value={form.subject} onChange={e => handleSubjectChange(e.target.value as Subject)} className={selectClass}>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">학년</label>
          <select value={form.grade_level} onChange={e => handleGradeChange(e.target.value as Grade)} className={selectClass}>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">주제 / 단원</label>
          <select value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} className={selectClass}>
            {TOPICS[form.subject][form.grade_level].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">문제 유형</label>
          <select value={form.question_type} onChange={e => setForm(f => ({ ...f, question_type: e.target.value }))}
            className={selectClass}>
            <option>객관식</option><option>단답형</option><option>서술형</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">난이도</label>
          <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
            className={selectClass}>
            <option>쉬움</option><option>보통</option><option>어려움</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">문제 수</label>
          <input type="number" min={1} max={10} value={form.count}
            onChange={e => setForm(f => ({ ...f, count: +e.target.value }))}
            className={selectClass} />
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button onClick={generate} disabled={loading} className="w-full">
        {loading ? '생성 중...' : 'AI로 생성'}
      </Button>
      {loading && <LoadingSpinner />}
      {questions.length > 0 && (
        <div className="mt-4 space-y-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">생성된 문제 ({questions.length}개)</h3>
          {questions.map((q, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
              <p className="font-medium text-sm mb-2 text-gray-900 dark:text-gray-100">{i + 1}. {q.content}</p>
              {q.options && <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-2">{q.options.map((o, j) => <li key={j}>{o}</li>)}</ul>}
              <p className="text-sm text-green-700 dark:text-green-400">정답: {q.answer}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{q.explanation}</p>
            </div>
          ))}
          {onSave && <Button variant="secondary" onClick={() => onSave(questions)} className="w-full">저장하기</Button>}
        </div>
      )}
    </div>
  )
}
