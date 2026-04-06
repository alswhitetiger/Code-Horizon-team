export type Role = 'teacher' | 'student' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  role: Role
}

export interface Course {
  id: string
  teacherId: string
  title: string
  subject: string
  gradeLevel?: string
  studentCount?: number
  createdAt: string
}

export interface Question {
  id: string
  type: '객관식' | '단답형' | '서술형'
  content: string
  options?: string[]
  answer: string
  explanation: string
  difficulty: '쉬움' | '보통' | '어려움'
  rubric?: string
}

export interface Assessment {
  id: string
  courseId: string
  title: string
  questions: Question[]
  createdAt: string
}

export interface Submission {
  id: string
  assessmentId: string
  studentId: string
  studentName?: string
  answers: Record<string, string>
  aiScore?: number
  aiFeedback?: string
  aiDetail?: {
    strengths: string[]
    improvements: string[]
    perQuestion: Array<{ questionId: string; score: number; comment: string }>
  }
  submittedAt: string
  status?: string
}

export interface StudentRisk {
  studentId: string
  name: string
  riskScore: number
  riskLevel: '높음' | '보통' | '낮음'
  reasons: string[]
  lastActiveAt: string
  progressPct: number
}

export interface DashboardMetrics {
  totalStudents: number
  activeToday: number
  atRiskCount: number
  avgProgressPct: number
  totalSubmissions: number
  avgScore: number
}

export interface RecommendedContent {
  id: string
  title: string
  type: '문제풀기' | '개념복습' | '보충학습'
  subject: string
  reason: string
  estimatedMinutes: number
}
