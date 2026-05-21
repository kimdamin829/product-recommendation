import { NextResponse } from 'next/server'
import { getDemoUserCookieOptions } from '@/lib/auth/demo-cookie'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('demo_user_id', '', {
    ...getDemoUserCookieOptions(0),
  })
  return res
}
