'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import Link from 'next/link'
import Image from 'next/image'
import { logout } from '@/lib/auth'
import ThemeToggle from '@/components/ui/ThemeToggle'

const NAV_LINKS = [
  { href: '/teacher', label: '대시보드' },
  { href: '/teacher/questions', label: '문제 생성' },
  { href: '/teacher/career', label: '학생 진로' },
]

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, token, setAuth, clearAuth } = useAuthStore()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const storedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
    if (!storedToken) { router.push('/login'); return }

    // 데모 토큰 차단
    if (storedToken.startsWith('demo-token-')) {
      clearAuth(); router.push('/login'); return
    }

    // 실제 토큰 검증
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` }
    }).then(r => {
      if (!r.ok) { clearAuth(); router.push('/login'); return }
      return r.json()
    }).then(data => {
      if (!data) return
      if (data.role !== 'teacher') { clearAuth(); router.push('/login'); return }
      setAuth({ id: data.id, email: data.email, name: data.name, role: data.role }, storedToken)
    }).catch(() => {
      if (user?.role !== 'teacher') { clearAuth(); router.push('/login') }
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/teacher">
              <Image src="/logo.png" alt="EDU Simplete" width={180} height={60} className="h-14 w-auto object-contain cursor-pointer mix-blend-multiply dark:mix-blend-screen" priority />
            </Link>
            <div className="hidden sm:flex items-center gap-5">
              {NAV_LINKS.map(l => (
                <Link key={l.href} href={l.href}
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">{user?.name || '교사'}</span>
            <button onClick={logout}
              className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400">
              로그아웃
            </button>
            <button onClick={() => setMenuOpen(o => !o)}
              className="sm:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="메뉴 열기">
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="block px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                {l.label}
              </Link>
            ))}
            <div className="flex items-center justify-between px-2 py-2 text-sm">
              <span className="text-gray-600 dark:text-gray-300">{user?.name || '교사'}</span>
              <button onClick={logout} className="text-red-500 dark:text-red-400">로그아웃</button>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}
