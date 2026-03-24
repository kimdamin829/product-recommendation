import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('demo_user_id', '', {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 0,
  })
  return res
}
