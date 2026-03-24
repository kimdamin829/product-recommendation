'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/lib/auth/auth-context'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshSession } = useAuth()
  const redirectAfterLogin = searchParams.get('next') || '/'
  const urlError = searchParams.get('error')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(urlError || '')

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const loginRes = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const loginData = await loginRes.json().catch(() => ({}))
      if (!loginRes.ok) {
        throw new Error(loginData?.error || '로그인에 실패했습니다.')
      }
      await refreshSession()
      router.replace(redirectAfterLogin)
      router.refresh()
    } catch (error: any) {
      setError(error.message || '로그인에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* PC: 메인 헤더 + 메인메뉴 */}
      <div className="hidden lg:block">
        <Header showCartButton />
      </div>
      {/* 모바일: 간단 헤더 */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="container mx-auto px-2 h-14 md:h-16 relative flex items-center">
          {/* 왼쪽: 뒤로가기 */}
          <button
            onClick={() => router.back()}
            aria-label="뒤로가기"
            className="p-2 text-gray-700 hover:text-gray-900"
          >
            <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* 중앙: 제목 */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-lg md:text-xl font-normal text-gray-900 whitespace-nowrap">
              로그인
            </h1>
          </div>
          
          {/* 오른쪽: 홈 버튼 */}
          <div className="ml-auto flex items-center">
            <Link
              href="/"
              aria-label="홈으로"
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <svg className="w-8 h-8 md:w-9 md:h-9 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1 bg-white flex items-start justify-center pt-12 pb-12 px-6">
        <div className="max-w-md w-full lg:max-w-sm lg:mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-primary-900">로그인</h2>

            {(error || urlError) && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-lg text-sm">
                {error || urlError}
              </div>
            )}

            <form onSubmit={handleDemoLogin} className="space-y-4 mb-6">
              <div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-green-800"
                  placeholder="아이디를 입력해주세요"
                />
              </div>


              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-800 text-white py-3 rounded-lg font-semibold hover:bg-blue-950 transition disabled:bg-gray-400"
              >
                {loading ? '로그인 중...' : '아이디로 로그인'}
              </button>
            </form>

        </div>
      </main>

      <div className="hidden lg:block lg:mt-16">
        <Footer />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <div className="hidden lg:block">
          <Header showCartButton />
        </div>
        <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
          <div className="container mx-auto px-2 h-14 md:h-16 relative flex items-center">
            <div className="w-10 h-10"></div>
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <h1 className="text-lg md:text-xl font-normal text-gray-900 whitespace-nowrap">로그인</h1>
            </div>
            <div className="ml-auto w-10 h-10"></div>
          </div>
        </header>
        <main className="flex-1 bg-white flex items-start justify-center pt-12 pb-12 px-6">
          <div className="max-w-md w-full">
            <div className="animate-pulse">로딩 중...</div>
          </div>
        </main>
        <div className="hidden lg:block">
          <Footer />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

