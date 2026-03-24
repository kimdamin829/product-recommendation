import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase-server'
import { DEPARTMENT_ID_TO_CATEGORY } from '@/lib/utils/constants'

// 동적 라우트로 설정 (searchParams 사용)
export const dynamic = 'force-dynamic'

// GET: 상품 목록 조회 (리뷰 통계 포함)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const category = searchParams.get('category')
    const searchQuery = searchParams.get('search')
    
    const from = (page - 1) * limit

    const supabase = createSupabaseAdminClient()
    let query = supabase
      .from('demo_products')
      .select('product_id, product_name, department_id', { count: 'exact' })
      .order('product_id', { ascending: true })

    if (searchQuery) {
      query = query.ilike('product_name', `%${searchQuery}%`)
    }

    if (category) {
      const departmentId = Object.entries(DEPARTMENT_ID_TO_CATEGORY).find(([, label]) => label === category)?.[0]
      if (departmentId) {
        query = query.eq('department_id', Number(departmentId))
      } else {
        // 정의되지 않은 카테고리가 오면 빈 결과 반환
        query = query.eq('department_id', -1)
      }
    }

    query = query.range(from, from + limit - 1)

    const { data: products, error, count } = await query

    if (error) {
      console.error('[API/products] 상품 조회 실패:', error)
      return NextResponse.json({ error: error.message || '상품 조회 실패' }, { status: 500 })
    }

    const mappedProducts = (products || []).map((p: any) => ({
      id: String(p.product_id),
      slug: null,
      brand: null,
      name: p.product_name,
      price: 0,
      image_url: null,
      category: DEPARTMENT_ID_TO_CATEGORY[p.department_id as number] || 'other',
      average_rating: null,
      review_count: 0,
      weight_gram: null,
      status: 'active',
      tax_type: 'taxable',
      created_at: null,
      updated_at: null,
      promotion: null,
    }))

    const totalPages = Math.ceil((count || 0) / limit)

    const response = NextResponse.json({
      products: mappedProducts,
      total: count || 0,
      page,
      totalPages,
    })

    // 캐싱 헤더 추가 (10초간 캐시)
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=60')

    return response
  } catch (error) {
    console.error('상품 목록 조회 에러:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

