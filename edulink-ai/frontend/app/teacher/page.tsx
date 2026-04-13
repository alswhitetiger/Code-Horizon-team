'use client'
import { useEffect, useState } from 'react'
import { teacherAPI } from '@/lib/api'
import { Course, Submission } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import SubmissionList from '@/components/teacher/SubmissionList'
import { mockCourses, mockSubmissions } from '@/lib/mock-data'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Student { id: string; name: string; email: string }

interface InviteModalProps {
  courseId: string
  courseTitle: string
  onClose: () => void
}

function InviteModal({ courseId, courseTitle, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [students, setStudents] = useState<Student[]>([])

  useEffect(() => {
    teacherAPI.getCourseStudents(courseId).then(setStudents).catch(() => {})
  }, [courseId])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setMessage('')
    setLoading(true)
    try {
      const res = await teacherAPI.inviteStudent(courseId, email.trim())
      setMessage(res.message)
      setEmail('')
      setStudents(prev => [...prev, { id: res.studentId, name: res.name, email: res.email }])
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr?.response?.data?.detail || '초대에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (studentId: string, studentName: string) => {
    if (!confirm(`${studentName} 학생을 강의에서 제거할까요?`)) return
    try {
      await teacherAPI.removeStudent(courseId, studentId)
      setStudents(prev => prev.filter(s => s.id !== studentId))
    } catch {
      alert('제거에 실패했습니다.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">학생 관리</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{courseTitle}</p>

        {/* 학생 추가 */}
        <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">학생 추가</p>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="학생 이메일 입력"
              className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? '...' : '추가'}
            </Button>
          </form>
          {message && <p className="text-green-600 dark:text-green-400 text-xs mt-2">{message}</p>}
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>

        {/* 학생 목록 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            등록된 학생 ({students.length}명)
          </h3>
          {students.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">아직 등록된 학생이 없습니다.</p>
          ) : (
            <ul className="space-y-2 max-h-52 overflow-y-auto">
              {students.map(s => (
                <li key={s.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(s.id, s.name)}
                    className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [inviteCourse, setInviteCourse] = useState<{ id: string; title: string } | null>(null)
  const pendingCount = submissions.filter(s => (s.status || '채점대기') === '채점대기').length

  useEffect(() => {
    teacherAPI.getCourses()
      .then(setCourses)
      .catch(() => setCourses(mockCourses))
    teacherAPI.getAllSubmissions()
      .then(setSubmissions)
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-8">
      {inviteCourse && (
        <InviteModal
          courseId={inviteCourse.id}
          courseTitle={inviteCourse.title}
          onClose={() => setInviteCourse(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">교사 대시보드</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">내 강의와 학생 현황을 확인하세요.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">내 강의 ({courses.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {courses.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-medium bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full">{c.subject}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{c.gradeLevel}</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{c.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">학생 {c.studentCount || 0}명</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setInviteCourse({ id: c.id, title: c.title })}
                  className="flex-1 text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-lg py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  학생 관리
                </button>
                <button
                  onClick={() => router.push(`/teacher/questions?courseId=${c.id}&subject=${encodeURIComponent(c.subject)}&grade=${encodeURIComponent(c.gradeLevel || '중1')}`)}
                  className="flex-1 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 rounded-lg py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  AI 문제 생성
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">최근 답안 제출</h2>
          <Link href="/teacher/grading">
            <span className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer">
              전체 보기
              {pendingCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </span>
          </Link>
        </div>
        <SubmissionList submissions={submissions} />
      </Card>
    </div>
  )
}
