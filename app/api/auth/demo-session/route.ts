import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('demo_user_id')?.value ?? null
  if (!userId) return NextResponse.json({ user: null })
  return NextResponse.json({
    user: {
      id: userId,
      user_metadata: { name: userId },
    },
  })
}
