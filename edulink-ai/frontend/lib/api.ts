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

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }).then(r => r.data),
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

export default api
