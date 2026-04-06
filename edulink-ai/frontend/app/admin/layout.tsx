'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import Link from 'next/link'
import { logout } from '@/lib/auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, setAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      if (!token) { router.push('/login'); return }
      if (!user && userData) setAuth(JSON.parse(userData), token)
      if (user && user.role !== 'admin') router.push('/login')
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-indigo-600 text-lg">EduLink AI</span>
          <Link href="/admin" className="text-sm text-gray-600 hover:text-indigo-600">관리자 대시보드</Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.name || '관리자'}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500">로그아웃</button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
