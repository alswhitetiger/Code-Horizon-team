import { Course, Assessment, Submission, DashboardMetrics, RecommendedContent, StudentRisk } from '@/types'

export const mockCourses: Course[] = [
  { id: '1', teacherId: 't1', title: '수학 기초', subject: '수학', gradeLevel: '중1', studentCount: 24, createdAt: '2024-01-15' },
  { id: '2', teacherId: 't1', title: '과학 탐구', subject: '과학', gradeLevel: '중2', studentCount: 18, createdAt: '2024-01-20' },
  { id: '3', teacherId: 't1', title: '영어 독해', subject: '영어', gradeLevel: '중3', studentCount: 30, createdAt: '2024-02-01' },
]

export const mockAssessments: Assessment[] = [
  {
    id: 'a1', courseId: '1', title: '1단원 평가 - 자연수와 사칙연산', createdAt: '2024-02-10',
    questions: [
      { id: 'q1', type: '객관식', content: '2 + 2 = ?', options: ['① 3', '② 4', '③ 5', '④ 6'], answer: '② 4', explanation: '기본 덧셈 계산', difficulty: '쉬움' },
      { id: 'q2', type: '객관식', content: '7 × 8 = ?', options: ['① 54', '② 56', '③ 58', '④ 64'], answer: '② 56', explanation: '7 곱하기 8은 56', difficulty: '보통' },
      { id: 'q3', type: '단답형', content: '15 ÷ 3 의 값을 쓰시오.', answer: '5', explanation: '15 나누기 3은 5', difficulty: '쉬움' },
      { id: 'q4', type: '서술형', content: '자연수의 덧셈과 뺄셈의 관계를 예를 들어 설명하시오.', answer: '덧셈과 뺄셈은 역연산 관계 (예: 3+4=7 이면 7-4=3)', explanation: '역연산 개념', difficulty: '어려움' },
    ]
  },
  {
    id: 'a2', courseId: '2', title: '물질의 상태 변화 평가', createdAt: '2024-02-12',
    questions: [
      { id: 'q1', type: '객관식', content: '물이 얼음으로 변하는 현상은?', options: ['① 융해', '② 응고', '③ 기화', '④ 액화'], answer: '② 응고', explanation: '고체로 변하는 것을 응고라 한다', difficulty: '쉬움' },
      { id: 'q2', type: '객관식', content: '물이 수증기로 변하는 현상은?', options: ['① 융해', '② 응고', '③ 기화', '④ 액화'], answer: '③ 기화', explanation: '액체에서 기체로 변하는 것이 기화', difficulty: '쉬움' },
      { id: 'q3', type: '서술형', content: '증발과 끓음의 차이를 설명하시오.', answer: '증발은 액체 표면에서만 기화, 끓음은 액체 내부에서도 기화가 일어남', explanation: '기화의 두 가지 방식', difficulty: '어려움' },
    ]
  },
  {
    id: 'a3', courseId: '3', title: '영어 독해 중간 평가', createdAt: '2024-02-15',
    questions: [
      { id: 'q1', type: '객관식', content: '"The book is on the table." 에서 on의 품사는?', options: ['① 명사', '② 동사', '③ 전치사', '④ 형용사'], answer: '③ 전치사', explanation: 'on은 위치를 나타내는 전치사', difficulty: '보통' },
      { id: 'q2', type: '단답형', content: '"happy"의 반의어를 영어로 쓰시오.', answer: 'sad', explanation: '기쁜의 반대는 슬픈(sad)', difficulty: '쉬움' },
      { id: 'q3', type: '서술형', content: '다음 문장의 주제를 한 문장으로 쓰시오: "Every morning, Tom wakes up early and exercises."', answer: '톰은 매일 아침 일찍 일어나 운동한다', explanation: '글의 중심 내용 파악', difficulty: '보통' },
    ]
  }
]

export const mockSubmissions: Submission[] = [
  // a1 - 수학 기초
  {
    id: 's1', assessmentId: 'a1', studentId: 'st1', studentName: '김철수',
    answers: { q1: '② 4', q2: '② 56', q3: '5', q4: '3+4=7이면 7-4=3이 됩니다. 덧셈과 뺄셈은 반대 관계입니다.' },
    aiScore: 95, aiFeedback: '전반적으로 아주 잘 풀었습니다. 서술형에서 예시를 더 추가하면 완벽합니다.',
    aiDetail: {
      strengths: ['객관식 모두 정답', '역연산 개념 이해'],
      improvements: ['서술형 답안에 더 많은 예시 제시'],
      perQuestion: [
        { questionId: 'q1', score: 25, comment: '정답' },
        { questionId: 'q2', score: 25, comment: '정답' },
        { questionId: 'q3', score: 25, comment: '정답' },
        { questionId: 'q4', score: 20, comment: '개념은 맞으나 예시 부족' },
      ]
    },
    submittedAt: '2024-02-11T09:30:00', status: '채점완료'
  },
  {
    id: 's2', assessmentId: 'a1', studentId: 'st2', studentName: '이영희',
    answers: { q1: '① 3', q2: '② 56', q3: '5', q4: '덧셈을 반대로 하면 뺄셈입니다.' },
    aiScore: 65, aiFeedback: '기초 덧셈 개념 복습이 필요합니다. 나머지는 잘 풀었습니다.',
    aiDetail: {
      strengths: ['곱셈 정확', '나눗셈 정확'],
      improvements: ['덧셈 기본 개념 복습 필요'],
      perQuestion: [
        { questionId: 'q1', score: 0, comment: '오답 - 정답은 ② 4' },
        { questionId: 'q2', score: 25, comment: '정답' },
        { questionId: 'q3', score: 25, comment: '정답' },
        { questionId: 'q4', score: 15, comment: '개념은 맞으나 예시 없음' },
      ]
    },
    submittedAt: '2024-02-11T10:15:00', status: '채점완료'
  },
  {
    id: 's3', assessmentId: 'a1', studentId: 'st3', studentName: '박민준',
    answers: { q1: '② 4', q2: '① 54', q3: '6', q4: '' },
    aiScore: 25, aiFeedback: '곱셈과 나눗셈을 다시 복습하고, 서술형 문제는 반드시 답해야 합니다.',
    submittedAt: '2024-02-11T11:00:00', status: '채점대기'
  },
  {
    id: 's4', assessmentId: 'a1', studentId: 'st4', studentName: '최수현',
    answers: { q1: '② 4', q2: '② 56', q3: '4', q4: '덧셈과 뺄셈은 서로 반대되는 연산입니다. 예를 들어 5+3=8이면 8-3=5입니다.' },
    aiScore: 75, aiFeedback: '나눗셈 실수가 아쉽지만 전체적으로 잘 이해하고 있습니다.',
    submittedAt: '2024-02-12T09:00:00', status: '채점대기'
  },
  // a2 - 과학 탐구
  {
    id: 's5', assessmentId: 'a2', studentId: 'st1', studentName: '김철수',
    answers: { q1: '② 응고', q2: '③ 기화', q3: '증발은 액체 표면에서만 기화가 일어나지만, 끓음은 액체 내부에서도 기화가 일어나는 차이가 있습니다.' },
    aiScore: 98, aiFeedback: '과학 개념을 완벽하게 이해하고 있습니다. 서술형 답변도 매우 훌륭합니다.',
    aiDetail: {
      strengths: ['상태 변화 개념 완벽 이해', '서술형 논리적 설명'],
      improvements: [],
      perQuestion: [
        { questionId: 'q1', score: 33, comment: '정답' },
        { questionId: 'q2', score: 33, comment: '정답' },
        { questionId: 'q3', score: 32, comment: '핵심 내용 정확히 기술' },
      ]
    },
    submittedAt: '2024-02-13T09:30:00', status: '채점완료'
  },
  {
    id: 's6', assessmentId: 'a2', studentId: 'st2', studentName: '이영희',
    answers: { q1: '① 융해', q2: '② 응고', q3: '잘 모르겠습니다.' },
    aiScore: 0, aiFeedback: '물질의 상태 변화 단원을 처음부터 복습해야 합니다. 융해, 응고, 기화 개념을 다시 정리하세요.',
    submittedAt: '2024-02-13T14:00:00', status: '채점대기'
  },
  // a3 - 영어 독해
  {
    id: 's7', assessmentId: 'a3', studentId: 'st3', studentName: '박민준',
    answers: { q1: '③ 전치사', q2: 'sad', q3: '톰은 아침에 일찍 일어나 운동한다.' },
    aiScore: 90, aiFeedback: '전반적으로 영어 개념을 잘 이해하고 있습니다. 훌륭합니다!',
    submittedAt: '2024-02-16T10:00:00', status: '채점대기'
  },
  {
    id: 's8', assessmentId: 'a3', studentId: 'st4', studentName: '최수현',
    answers: { q1: '① 명사', q2: 'angry', q3: '톰의 아침 루틴에 대한 이야기입니다.' },
    aiScore: 30, aiFeedback: '전치사 개념과 반의어를 다시 학습하세요.',
    submittedAt: '2024-02-16T14:30:00', status: '채점대기'
  },
]

export const mockDashboard: DashboardMetrics = {
  totalStudents: 72, activeToday: 45, atRiskCount: 8, avgProgressPct: 68, totalSubmissions: 156, avgScore: 74.5
}

export const mockAtRisk: StudentRisk[] = [
  { studentId: 'st3', name: '박민준', riskScore: 85, riskLevel: '높음', reasons: ['7일간 미접속', '평균 점수 35점'], lastActiveAt: '2024-02-01', progressPct: 20 },
  { studentId: 'st4', name: '최수현', riskScore: 65, riskLevel: '보통', reasons: ['3일간 미접속', '제출 횟수 낮음'], lastActiveAt: '2024-02-08', progressPct: 40 },
]

export const mockRecommendations: RecommendedContent[] = [
  { id: 'r1', title: '분수 개념 복습', type: '개념복습', subject: '수학', reason: '최근 분수 문제 오답률 높음', estimatedMinutes: 20 },
  { id: 'r2', title: '산성과 염기 문제풀기', type: '문제풀기', subject: '과학', reason: '미학습 단원 발견', estimatedMinutes: 30 },
  { id: 'r3', title: '영어 독해 보충', type: '보충학습', subject: '영어', reason: '평균 이하 점수 기록', estimatedMinutes: 25 },
]
