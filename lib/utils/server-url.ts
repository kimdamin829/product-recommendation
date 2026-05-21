import { headers } from 'next/headers'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'

export async function getServerBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (envUrl) {
    // 배포 환경에서 localhost URL이 설정되면 서버 self-fetch가 실패함
    const isLocalhostUrl = /localhost|127\.0\.0\.1/.test(envUrl)
    if (isLocalhostUrl && process.env.NODE_ENV === 'production') {
      return null
    }
    // 로컬 빌드(next build)에서 localhost:3000을 향하는 URL이면 사용하지 않음
    if (
      process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD &&
      /localhost:3000|127\.0\.0\.1:3000/.test(envUrl)
    ) {
      return null
    }
    return envUrl
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    return null
  }

  const hdrs = await headers()
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host')
  if (!host) {
    return null
  }

  const proto = hdrs.get('x-forwarded-proto') || 'http'
  return `${proto}://${host}`
}
