import axios from 'axios'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const DEMO_ACCOUNTS: Record<string, { id: string; name: string; role: string }> = {
  'teacher@demo.com': { id: 'demo-t1', name: '김교사 (데모)', role: 'teacher' },
  'student@demo.com': { id: 'demo-s1', name: '김학생 (데모)', role: 'student' },
  'admin@demo.com':   { id: 'demo-a1', name: '관리자 (데모)', role: 'admin' },
}

// Auth
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      return await api.post('/api/auth/login', { email, password }).then(r => r.data)
    } catch (err: unknown) {
      const axiosErr = err as { response?: object; code?: string }
      // Backend unreachable → use demo mock accounts
      if (!axiosErr.response && password === 'demo1234' && DEMO_ACCOUNTS[email]) {
        return {
          access_token: `demo-token-${email}`,
          user: { email, ...DEMO_ACCOUNTS[email] },
        }
      }
      throw err
    }
  },
  register: (email: string, password: string, name: string, role: string) =>
    api.post('/api/auth/register', { email, password, name, role }).then(r => r.data),
  me: () => api.get('/api/auth/me').then(r => r.data),
}

// Teacher
export const teacherAPI = {
  getCourses: () => api.get('/api/teacher/courses').then(r => r.data),
  createCourse: (data: { title: string; subject: string; gradeLevel?: string }) =>
    api.post('/api/teacher/courses', data).then(r => r.data),
  getCourseStats: (id: string) => api.get(`/api/teacher/courses/${id}/stats`).then(r => r.data),
  generateQuestions: (data: object) =>
    api.post('/api/teacher/questions/generate', data).then(r => r.data),
  createAssessment: (data: object) =>
    api.post('/api/teacher/assessments', data).then(r => r.data),
  getSubmissions: (assessmentId: string) =>
    api.get(`/api/teacher/assessments/${assessmentId}/submissions`).then(r => r.data),
  gradeSubmission: (submissionId: string, data: object) =>
    api.post(`/api/teacher/submissions/${submissionId}/grade`, data).then(r => r.data),
}

// Student
export const studentAPI = {
  getCourses: () => api.get('/api/student/courses').then(r => r.data),
  getAssessments: (courseId: string) =>
    api.get(`/api/student/courses/${courseId}/assessments`).then(r => r.data),
  getAssessment: (assessmentId: string) =>
    api.get(`/api/student/assessments/${assessmentId}`).then(r => r.data),
  submit: (data: { assessment_id: string; answers: Record<string, string> }) =>
    api.post('/api/student/submissions', data).then(r => r.data),
  getProgress: () => api.get('/api/student/progress').then(r => r.data),
  getRecommendations: () => api.get('/api/student/recommendations').then(r => r.data),
  logEvent: (data: object) => api.post('/api/student/logs', data).then(r => r.data),
}

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/api/admin/dashboard').then(r => r.data),
  getAtRisk: (threshold = 60) => api.get(`/api/admin/at-risk?threshold=${threshold}`).then(r => r.data),
  getReport: (courseId?: string, period = 'week') =>
    api.get(`/api/admin/report?period=${period}${courseId ? `&course_id=${courseId}` : ''}`).then(r => r.data),
  getCourses: () => api.get('/api/admin/courses').then(r => r.data),
  getStudents: () => api.get('/api/admin/students').then(r => r.data),
}

// Career
export const careerAPI = {
  getGoal: () => api.get('/api/career/goal').then(r => r.data),
  setGoal: (career_name: string, reason?: string) =>
    api.post('/api/career/goal', { career_name, reason }).then(r => r.data),
  getGuidance: () => api.get('/api/career/guidance').then(r => r.data),
  chat: (message: string, history: Array<{ role: string; content: string }>) =>
    api.post('/api/career/chat', { message, history }).then(r => r.data),
  getQuestions: (career_name: string, subject?: string, count = 5) =>
    api.post('/api/career/questions', { career_name, subject, count }).then(r => r.data),
  // 교사용
  getStudentsCareers: () => api.get('/api/career/teacher/students').then(r => r.data),
  teacherGenerateQuestions: (career_name: string, subject?: string, count = 5) =>
    api.post('/api/career/teacher/questions', { career_name, subject, count }).then(r => r.data),
}

export default api
