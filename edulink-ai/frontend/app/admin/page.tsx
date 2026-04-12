'use client'
import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/api'
import { DashboardMetrics, StudentRisk } from '@/types'
import Card from '@/components/ui/Card'
import MetricCards from '@/components/admin/MetricCards'
import AtRiskTable from '@/components/admin/AtRiskTable'
import ReportGenerator from '@/components/admin/ReportGenerator'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { mockDashboard, mockAtRisk } from '@/lib/mock-data'

interface CourseItem { id: string; title: string; subject: string; gradeLevel: string; studentCount: number; createdAt: string }

const weeklyData = [
  { date: '월', active: 40, submissions: 15 },
  { date: '화', active: 52, submissions: 22 },
  { date: '수', active: 45, submissions: 18 },
  { date: '목', active: 60, submissions: 30 },
  { date: '금', active: 55, submissions: 25 },
  { date: '토', active: 20, submissions: 5 },
  { date: '일', active: 15, submissions: 3 },
]

interface UserItem { id: string; name: string; email: string; role: string; createdAt: string }

type Tab = 'dashboard' | 'users'

const ROLE_LABELS: Record<string, string> = { student: '학생', teacher: '교사', admin: '관리자' }
const ROLE_COLORS: Record<string, string> = {
  student: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  teacher: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  admin: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
}

function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: UserItem) => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await adminAPI.createUser(form)
      onCreated(user)
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr?.response?.data?.detail || '생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">사용자 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이름</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="홍길동" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이메일</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="user@email.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">비밀번호</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="6자 이상" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">역할</label>
            <div className="flex gap-2">
              {(['student', 'teacher', 'admin'] as const).map(r => (
                <label key={r} className={`flex-1 flex items-center justify-center py-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                  form.role === r ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}>
                  <input type="radio" name="role" value={r} checked={form.role === r} onChange={() => setForm(f => ({ ...f, role: r }))} className="sr-only" />
                  {ROLE_LABELS[r]}
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? '생성 중...' : '사용자 생성'}
          </button>
        </form>
      </div>
    </div>
  )
}

const SUBJECT_OPTIONS = ['수학', '영어', '국어', '과학탐구', '사회탐구', '물리', '화학', '생명과학', '지구과학', '한국사', '기타']
const GRADE_OPTIONS = ['중1', '중2', '중3', '고1', '고2', '고3']

function TeacherCoursesModal({ teacher, onClose }: { teacher: UserItem; onClose: () => void }) {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', subject: '수학', grade_level: '중1' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    adminAPI.getTeacherCourses(teacher.id)
      .then(setCourses)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [teacher.id])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('강의명을 입력하세요.'); return }
    setError(''); setSaving(true)
    try {
      const created = await adminAPI.createCourseForTeacher(teacher.id, form)
      setCourses(prev => [created, ...prev])
      setForm(f => ({ ...f, title: '' }))
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr?.response?.data?.detail || '강의 추가에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">강의 관리</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          <span className="font-medium text-gray-700 dark:text-gray-300">{teacher.name}</span> 교사 · {teacher.email}
        </p>

        {/* 강의 추가 폼 */}
        <form onSubmit={handleAdd} className="space-y-3 mb-5 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">새 강의 추가</p>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="강의명 (예: 중1 수학 기초반)"
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <select
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={form.grade_level}
              onChange={e => setForm(f => ({ ...f, grade_level: e.target.value }))}
              className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '추가 중...' : '+ 강의 추가'}
          </button>
        </form>

        {/* 강의 목록 */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            등록된 강의 ({courses.length}개)
          </p>
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">불러오는 중...</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">등록된 강의가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {courses.map(c => (
                <li key={c.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {c.subject} · {c.gradeLevel} · 학생 {c.studentCount}명
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{c.createdAt.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [metrics, setMetrics] = useState<DashboardMetrics>(mockDashboard)
  const [atRisk, setAtRisk] = useState<StudentRisk[]>(mockAtRisk)
  const [users, setUsers] = useState<UserItem[]>([])
  const [userFilter, setUserFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [usersLoaded, setUsersLoaded] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<UserItem | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [m, r] = await Promise.all([adminAPI.getDashboard(), adminAPI.getAtRisk()])
        setMetrics(m); setAtRisk(r)
      } catch { /* use mock */ }
    }
    load()
  }, [])

  useEffect(() => {
    if (tab === 'users' && !usersLoaded) {
      adminAPI.getUsers().then(u => { setUsers(u); setUsersLoaded(true) }).catch(() => {})
    }
  }, [tab, usersLoaded])

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`${userName} 사용자를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return
    try {
      await adminAPI.deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      alert(axiosErr?.response?.data?.detail || '삭제에 실패했습니다.')
    }
  }

  const filteredUsers = users.filter(u =>
    !userFilter || u.role === userFilter
  )

  return (
    <div className="space-y-6">
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onCreated={u => setUsers(prev => [u, ...prev])}
        />
      )}
      {selectedTeacher && (
        <TeacherCoursesModal
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">관리자 대시보드</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">전체 학습 현황을 모니터링합니다.</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-fit">
        {([['dashboard', '대시보드'], ['users', '사용자 관리']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === key ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* 대시보드 탭 */}
      {tab === 'dashboard' && (
        <>
          <MetricCards metrics={metrics} />

          <Card>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">주간 활성 현황</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="active" stroke="#6366f1" strokeWidth={2} name="활성 학생" />
                  <Line type="monotone" dataKey="submissions" stroke="#10b981" strokeWidth={2} name="제출 수" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">이탈 위험 학생</h2>
            <AtRiskTable students={atRisk} />
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">AI 자동 리포트</h2>
            <ReportGenerator />
          </Card>
        </>
      )}

      {/* 사용자 관리 탭 */}
      {tab === 'users' && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex gap-2">
              {[['', '전체'], ['student', '학생'], ['teacher', '교사'], ['admin', '관리자']].map(([val, label]) => (
                <button key={val} onClick={() => setUserFilter(val)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    userFilter === val ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}>
                  {label} {val === '' ? `(${users.length})` : `(${users.filter(u => u.role === val).length})`}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              + 사용자 추가
            </button>
          </div>

          {filteredUsers.length === 0 ? (
            <p className="text-center text-gray-400 py-8">사용자가 없습니다.</p>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">이름</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">이메일</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">역할</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-400">가입일</th>
                      <th className="py-3 px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">{u.name}</td>
                        <td className="py-3 px-2 text-gray-500 dark:text-gray-400">{u.email}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                            {ROLE_LABELS[u.role]}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-400 dark:text-gray-500">{u.createdAt.slice(0, 10)}</td>
                        <td className="py-3 px-2 text-right flex items-center justify-end gap-3">
                          {u.role === 'teacher' && (
                            <button
                              onClick={() => setSelectedTeacher(u)}
                              className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 font-medium"
                            >
                              강의 관리
                            </button>
                          )}
                          <button onClick={() => handleDeleteUser(u.id, u.name)}
                            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400">
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden space-y-3">
                {filteredUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{u.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {u.role === 'teacher' && (
                        <button onClick={() => setSelectedTeacher(u)}
                          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                          강의 관리
                        </button>
                      )}
                      <button onClick={() => handleDeleteUser(u.id, u.name)}
                        className="text-xs text-red-500 hover:text-red-700">
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
