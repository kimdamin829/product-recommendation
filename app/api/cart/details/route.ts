import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase-server'

export const dynamic = 'force-dynamic'

const MAX_IDS = 100

/**
 * GET /api/cart/details?ids=id1,id2,id3
 * 비로그인 장바구니용: 상품 ID 목록에 대한 최신 상품 정보 반환 (이름, 가격, 이미지, 할인, 상태 등)
 */
export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get('ids')
    if (!idsParam || typeof idsParam !== 'string') {
      return NextResponse.json({ details: [] })
    }
    const ids = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, MAX_IDS)
    if (ids.length === 0) {
      return NextResponse.json({ details: [] })
    }

    const supabase = createSupabaseAdminClient()
    const numericIds = ids.map((id) => Number(id)).filter((id) => Number.isFinite(id))
    if (numericIds.length === 0) {
      return NextResponse.json({ details: [] })
    }

    const { data: products, error } = await supabase
      .from('demo_products')
      .select('product_id, product_name')
      .in('product_id', numericIds)

    if (error) {
      console.error('[cart/details] 상품 조회 실패:', error)
      return NextResponse.json({ error: '상품 조회 실패' }, { status: 500 })
    }

    const details = (products || []).map((product: any) => {
      return {
        productId: String(product.product_id),
        slug: null,
        name: product.product_name ?? '',
        price: 0,
        brand: null,
        status: 'active',
        imageUrl: null,
        discount_percent: 0,
      }
    })

    return NextResponse.json({ details })
  } catch (error) {
    console.error('[cart/details] 에러:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
