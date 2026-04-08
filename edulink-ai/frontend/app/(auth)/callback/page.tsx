'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const token = params.get('token')
    const role = params.get('role')
    const error = params.get('error')

    if (error) {
      const messages: Record<string, string> = {
        kakao_not_configured: '카카오 로그인이 설정되지 않았습니다.',
        naver_not_configured: '네이버 로그인이 설정되지 않았습니다.',
        google_not_configured: '구글 로그인이 설정되지 않았습니다.',
        kakao_denied: '카카오 로그인이 취소되었습니다.',
        naver_denied: '네이버 로그인이 취소되었습니다.',
        google_denied: '구글 로그인이 취소되었습니다.',
      }
      router.replace(`/login?error=${encodeURIComponent(messages[error] || '로그인에 실패했습니다.')}`)
      return
    }

    if (token && role) {
      // JWT에서 사용자 정보 파싱 (payload는 base64)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setAuth(
          { id: payload.sub, role, email: '', name: '' },
          token
        )
      } catch {
        setAuth({ id: '', role, email: '', name: '' }, token)
      }

      if (role === 'teacher') router.replace('/teacher')
      else if (role === 'admin') router.replace('/admin')
      else router.replace('/student')
    } else {
      router.replace('/login?error=' + encodeURIComponent('인증 정보를 받지 못했습니다.'))
    }
  }, [params, router, setAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">로그인 처리 중...</p>
      </div>
    </div>
  )
}
