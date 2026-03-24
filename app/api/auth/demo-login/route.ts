import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = String(body?.userId ?? '').trim()
    if (!userId) {
      return NextResponse.json({ error: 'user_id가 필요합니다.' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('demo_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message || '로그인 실패' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: '존재하지 않는 user_id 입니다.' }, { status: 404 })
    }

    const res = NextResponse.json({ ok: true, userId })
    res.cookies.set('demo_user_id', userId, {
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '서버 오류' }, { status: 500 })
  }
}
