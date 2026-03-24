import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const sourceId = String(id ?? '').trim()
    if (!sourceId) {
      return NextResponse.json({ error: '상품 ID가 필요합니다.' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()
    const sourceAsNumber = Number(sourceId)
    const sourceFilterValue = Number.isFinite(sourceAsNumber) ? sourceAsNumber : sourceId

    const { data: rows, error } = await supabase
      .from('product_cooccurrence')
      .select('recommended_product_id, rank')
      .eq('source_product_id', sourceFilterValue)
      .order('rank', { ascending: true })
      .limit(20)

    if (error) {
      console.error('[cooccurrence] 조회 실패:', error)
      return NextResponse.json({ error: '추천 상품 조회 실패' }, { status: 500 })
    }

    const recRows = rows || []
    const recommendedIds = recRows
      .map((r: any) => Number(r.recommended_product_id))
      .filter((n: number) => Number.isFinite(n))

    if (recommendedIds.length === 0) {
      return NextResponse.json({ products: [] })
    }

    const { data: products, error: productsError } = await supabase
      .from('demo_products')
      .select('product_id, product_name, department_id')
      .in('product_id', recommendedIds)

    if (productsError) {
      console.error('[cooccurrence] 상품 조회 실패:', productsError)
      return NextResponse.json({ error: '추천 상품 조회 실패' }, { status: 500 })
    }

    const productMap = new Map<number, any>(
      (products || []).map((p: any) => [Number(p.product_id), p])
    )

    const nowIso = new Date().toISOString()
    const orderedProducts = recRows
      .map((row: any) => {
        const pid = Number(row.recommended_product_id)
        const p = productMap.get(pid)
        if (!p) return null
        return {
          id: String(p.product_id),
          slug: null,
          brand: null,
          name: p.product_name || '',
          price: 0,
          image_url: null,
          category: String(p.department_id ?? ''),
          average_rating: 0,
          review_count: 0,
          promotion: null,
          weight_gram: null,
          status: 'active',
          tax_type: 'taxable',
          created_at: nowIso,
          updated_at: nowIso,
          rank: row.rank,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ products: orderedProducts })
  } catch (error: any) {
    console.error('[cooccurrence] 서버 오류:', error)
    return NextResponse.json(
      { error: error?.message || '서버 오류' },
      { status: 500 }
    )
  }
}

