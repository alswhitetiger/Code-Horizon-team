'use client'
import { useState, useEffect, Suspense } from 'react'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { useRouter, useSearchParams } from 'next/navigation'
import { User } from '@/types'
import Image from 'next/image'
import ThemeToggle from '@/components/ui/ThemeToggle'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Mode = 'login' | 'register' | 'verify'

const DEMO_ACCOUNTS = [
  { role: '교사', email: 'teacher@demo.com', password: 'demo1234', label: '교사 체험', color: 'bg-blue-500 hover:bg-blue-600' },
  { role: '학생', email: 'student@demo.com', password: 'demo1234', label: '학생 체험', color: 'bg-green-500 hover:bg-green-600' },
  { role: '관리자', email: 'admin@demo.com', password: 'demo1234', label: '관리자 체험', color: 'bg-purple-500 hover:bg-purple-600' },
]

function LoginContent() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [devCode, setDevCode] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const err = params.get('error')
    if (err) setError(decodeURIComponent(err))
  }, [params])

  const redirect = (userRole: string) => {
    if (userRole === 'teacher') router.push('/teacher')
    else if (userRole === 'admin') router.push('/admin')
    else router.push('/student')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authAPI.login(email, password)
      setAuth(data.user as User, data.access_token)
      redirect(data.user.role)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } }
      const detail = axiosErr?.response?.data?.detail || '로그인에 실패했습니다.'
      if (axiosErr?.response?.status === 403) {
        setMode('verify')
        setDevCode('')
        setError(detail)
      } else {
        setError(detail)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setLoading(true)
    setError('')
    try {
      const data = await authAPI.login(demoEmail, demoPassword)
      setAuth(data.user as User, data.access_token)
      redirect(data.user.role)
    } catch {
      setError('데모 계정 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('비밀번호가 일치하지 않습니다.'); return }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
    setLoading(true)
    try {
      const data = await authAPI.register(email, password, name, role)
      setDevCode(data.verification_code || '')
      setEmailSent(data.email_sent === true)
      setMode('verify')
      setError('')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr?.response?.data?.detail || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authAPI.verifyEmail(email, verifyCode)
      setAuth(data.user as User, data.access_token)
      redirect(data.user.role)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr?.response?.data?.detail || '인증에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    try {
      const data = await authAPI.resendCode(email)
      if (data.verification_code) {
        setDevCode(data.verification_code)
        setEmailSent(false)
      }
      setError('인증 코드가 재발송되었습니다.')
    } catch {
      setError('재발송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: 'login' | 'register') => {
    setMode(m); setError(''); setEmail(''); setPassword(''); setName(''); setConfirmPassword(''); setVerifyCode(''); setDevCode('')
  }

  // ── 이메일 인증 화면 ──────────────────────────────────────────────────────────
  if (mode === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
        <div className="fixed top-4 right-4"><ThemeToggle /></div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <Image src="/logo.png" alt="EduLink AI" width={260} height={87} className="h-20 w-auto object-contain mx-auto mix-blend-multiply dark:mix-blend-screen" priority />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">이메일 인증</h2>
          {devCode ? (
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl">
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mb-2">📧 이메일 발송이 불가한 환경입니다.</p>
              <p className="text-sm text-amber-600 dark:text-amber-300 mb-3">아래 인증 코드를 직접 입력해주세요.</p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-amber-200 dark:border-amber-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">인증 코드</p>
                <p className="text-3xl font-bold tracking-[0.3em] text-indigo-600 dark:text-indigo-400">{devCode}</p>
              </div>
            </div>
          ) : emailSent ? (
            <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg">
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                <span className="font-medium">{email}</span> 으로 인증 코드를 발송했습니다.
              </p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">받은편지함(또는 스팸함)을 확인해주세요.</p>
            </div>
          ) : null}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">인증 코드 6자리</label>
              <input
                type="text"
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            {error && <p className={`text-sm ${error.includes('재발송') ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{error}</p>}
            <button type="submit" disabled={loading || verifyCode.length !== 6}
              className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? '인증 중...' : '인증 완료'}
            </button>
          </form>
          <div className="mt-4 flex gap-3 text-sm text-center">
            <button onClick={handleResendCode} disabled={loading} className="flex-1 text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50">
              코드 재발송
            </button>
            <button onClick={() => switchMode('login')} className="flex-1 text-gray-500 dark:text-gray-400 hover:underline">
              로그인으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 로그인 / 회원가입 화면 ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="fixed top-4 right-4"><ThemeToggle /></div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <Image src="/logo.png" alt="EduLink AI" width={260} height={87} className="h-20 w-auto object-contain mx-auto mix-blend-multiply dark:mix-blend-screen" priority />
          <p className="text-gray-500 dark:text-gray-400 mt-2">AI 기반 교육 플랫폼</p>
        </div>

        {/* 데모 계정 */}
        <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 text-center">🎯 데모 계정으로 체험하기</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.email} onClick={() => handleDemoLogin(acc.email, acc.password)}
                disabled={loading}
                className={`${acc.color} text-white text-xs font-medium py-2 px-1 rounded-lg transition-colors disabled:opacity-50`}>
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        {/* 로그인 / 회원가입 탭 */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-6">
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => switchMode(m)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === m ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}>
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* 소셜 로그인 */}
        <div className="space-y-3 mb-6">
          <a href={`${API_BASE}/api/auth/naver`}
            className="flex items-center justify-center gap-3 w-full py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#03C75A', color: '#fff' }}>
            <span className="font-bold text-lg leading-none">N</span>
            네이버로 {mode === 'login' ? '로그인' : '시작하기'}
          </a>
          <a href={`${API_BASE}/api/auth/google`}
            className="flex items-center justify-center gap-3 w-full py-2.5 rounded-lg font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors hover:bg-gray-50 dark:hover:bg-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            구글로 {mode === 'login' ? '로그인' : '시작하기'}
          </a>
        </div>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-gray-800 px-3 text-gray-500 dark:text-gray-400">
              또는 이메일로 {mode === 'login' ? '로그인' : '회원가입'}
            </span>
          </div>
        </div>

        {/* 로그인 폼 */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이메일</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="이메일 주소" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">비밀번호</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="비밀번호" required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors">
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        )}

        {/* 회원가입 폼 */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이름</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="홍길동" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이메일</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="example@email.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">역할</label>
              <div className="flex gap-3">
                {(['student', 'teacher'] as const).map(r => (
                  <label key={r} className={`flex-1 flex items-center justify-center gap-2 border rounded-lg py-2.5 cursor-pointer transition-colors ${
                    role === r ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}>
                    <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
                    <span className="text-sm font-medium">{r === 'student' ? '학생' : '교사'}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">비밀번호</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="6자 이상" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">비밀번호 확인</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="비밀번호 재입력" required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors">
              {loading ? '처리 중...' : '회원가입 및 인증코드 받기'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
