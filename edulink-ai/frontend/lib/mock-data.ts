import { Course, Assessment, Submission, DashboardMetrics, RecommendedContent, StudentRisk } from '@/types'

export const mockCourses: Course[] = [
  { id: '1', teacherId: 't1', title: '수학 기초', subject: '수학', gradeLevel: '중1', studentCount: 24, createdAt: '2024-01-15' },
  { id: '2', teacherId: 't1', title: '과학 탐구', subject: '과학', gradeLevel: '중2', studentCount: 18, createdAt: '2024-01-20' },
  { id: '3', teacherId: 't1', title: '영어 독해', subject: '영어', gradeLevel: '중3', studentCount: 30, createdAt: '2024-02-01' },
]

export const mockAssessments: Assessment[] = [
  {
    id: 'a1', courseId: '1', title: '1단원 평가', createdAt: '2024-02-10',
    questions: [
      { id: 'q1', type: '객관식', content: '2 + 2 = ?', options: ['① 3', '② 4', '③ 5', '④ 6'], answer: '② 4', explanation: '기본 덧셈', difficulty: '쉬움' }
    ]
  }
]

export const mockSubmissions: Submission[] = [
  { id: 's1', assessmentId: 'a1', studentId: 'st1', studentName: '김철수', answers: { q1: '② 4' }, aiScore: 85, aiFeedback: '잘 풀었습니다.', submittedAt: '2024-02-11', status: '채점완료' },
  { id: 's2', assessmentId: 'a1', studentId: 'st2', studentName: '이영희', answers: { q1: '① 3' }, aiScore: 40, aiFeedback: '기초 개념 복습이 필요합니다.', submittedAt: '2024-02-11', status: '채점완료' },
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
