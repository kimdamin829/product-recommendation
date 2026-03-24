import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase-server'
import { DEPARTMENT_ID_TO_CATEGORY } from '@/lib/utils/constants'

export const dynamic = 'force-dynamic'

// GET: demo_products.department_id 기준 카테고리 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()

    const { data, error } = await supabase
      .from('demo_products')
      .select('department_id')
      .not('department_id', 'is', null)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const uniqueCategories = Array.from(
      new Set(
        (data || [])
          .map((item: any) => DEPARTMENT_ID_TO_CATEGORY[item.department_id as number] || null)
          .filter(Boolean)
      )
    ) as string[]
    const sortedCategories = uniqueCategories.sort()

    return NextResponse.json({ categories: sortedCategories })
  } catch (error: any) {
    console.error('카테고리 조회 실패:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

