'use client'
import { useEffect, useRef, useState } from 'react'
import { teacherAPI } from '@/lib/api'
import { Course, Submission } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import SubmissionList from '@/components/teacher/SubmissionList'
import { mockCourses, mockSubmissions } from '@/lib/mock-data'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Student { id: string; name: string; email: string }

interface CourseVideo {
  id: string
  courseId: string
  title: string
  description: string
  url: string
  fileSize: number | null
  mimeType: string | null
  createdAt: string
}

// ─── 학생 관리 모달 ────────────────────────────────────────────────────────────
function InviteModal({ courseId, courseTitle, onClose }: { courseId: string; courseTitle: string; onClose: () => void }) {
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
            <Button type="submit" disabled={loading}>{loading ? '...' : '추가'}</Button>
          </form>
          {message && <p className="text-green-600 dark:text-green-400 text-xs mt-2">{message}</p>}
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>

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

// ─── 영상 관리 모달 ────────────────────────────────────────────────────────────
function VideoModal({ courseId, courseTitle, onClose }: { courseId: string; courseTitle: string; onClose: () => void }) {
  const [videos, setVideos] = useState<CourseVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    teacherAPI.getCourseVideos(courseId)
      .then(setVideos)
      .catch(() => setVideos([]))
      .finally(() => setLoading(false))
  }, [courseId])

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('영상 파일을 선택해주세요.'); return }
    if (!title.trim()) { setError('영상 제목을 입력해주세요.'); return }

    setError(''); setUploading(true); setUploadProgress(0)
    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('description', description.trim())
    formData.append('file', file)

    try {
      // axios로 직접 호출해 progress 트래킹
      const { default: api } = await import('@/lib/api')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teacher/courses/${courseId}/videos`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || '업로드에 실패했습니다.')
      }
      const newVideo: CourseVideo = await res.json()
      setVideos(prev => [newVideo, ...prev])
      setTitle(''); setDescription(''); setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setUploadProgress(100)
      setTimeout(() => setUploadProgress(0), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (videoId: string, videoTitle: string) => {
    if (!confirm(`"${videoTitle}" 영상을 삭제할까요?`)) return
    try {
      await teacherAPI.deleteVideo(videoId)
      setVideos(prev => prev.filter(v => v.id !== videoId))
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">강의 영상 관리</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{courseTitle}</p>

        {/* 업로드 폼 */}
        <form onSubmit={handleUpload} className="mb-5 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-3 flex-shrink-0">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">새 영상 업로드</p>

          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="영상 제목 (예: 1강 - 일차방정식 개념)"
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="설명 (선택)"
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <div>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{formatSize(file.size)}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">클릭하여 영상 파일 선택</p>
                <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI, MKV 등</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </form>

        {/* 영상 목록 */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            등록된 영상 ({videos.length}개)
          </p>
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">불러오는 중...</p>
          ) : videos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">등록된 영상이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {videos.map(v => (
                <li key={v.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{v.title}</p>
                      {v.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{v.description}</p>
                      )}
                      <p className="text-xs text-gray-400">{formatSize(v.fileSize)} · {v.createdAt.slice(0, 10)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(v.id, v.title)}
                    className="ml-3 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium flex-shrink-0"
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

// ─── 교사 대시보드 ─────────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [inviteCourse, setInviteCourse] = useState<{ id: string; title: string } | null>(null)
  const [videoCourse, setVideoCourse] = useState<{ id: string; title: string } | null>(null)
  const pendingCount = submissions.filter(s => (s.status || '채점대기') === '채점대기').length

  useEffect(() => {
    teacherAPI.getCourses()
      .then(setCourses)
      .catch(() => setCourses(mockCourses))
    teacherAPI.getAllSubmissions()
      .then(setSubmissions)
      .catch(() => setSubmissions(mockSubmissions))
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
      {videoCourse && (
        <VideoModal
          courseId={videoCourse.id}
          courseTitle={videoCourse.title}
          onClose={() => setVideoCourse(null)}
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setInviteCourse({ id: c.id, title: c.title })}
                  className="text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-lg py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  학생 관리
                </button>
                <button
                  onClick={() => router.push(`/teacher/questions?courseId=${c.id}&subject=${encodeURIComponent(c.subject)}&grade=${encodeURIComponent(c.gradeLevel || '중1')}`)}
                  className="text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 rounded-lg py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  AI 문제 생성
                </button>
                <button
                  onClick={() => setVideoCourse({ id: c.id, title: c.title })}
                  className="col-span-2 text-sm text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700 rounded-lg py-1.5 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  영상 관리
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
