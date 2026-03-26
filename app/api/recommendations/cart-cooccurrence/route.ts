import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const rawIds = Array.isArray(body?.productIds) ? body.productIds : []
    const sourceIds = Array.from(new Set(rawIds.map((id: any) => String(id).trim()).filter(Boolean)))

    if (sourceIds.length === 0) {
      return NextResponse.json({ products: [] })
    }

    const supabase = createSupabaseAdminClient()
    const sourceFilterValues = sourceIds.map((id) => {
      const asNumber = Number(id)
      return Number.isFinite(asNumber) ? asNumber : id
    })

    const { data: rows, error } = await supabase
      .from('product_cooccurrence')
      .select('source_product_id, recommended_product_id, pair_count')
      .in('source_product_id', sourceFilterValues)
      .order('pair_count', { ascending: false })
      .limit(300)

    if (error) {
      console.error('[cart-cooccurrence] 조회 실패:', error)
      return NextResponse.json({ error: '추천 상품 조회 실패' }, { status: 500 })
    }

    const scoreMap = new Map<string, number>()
    for (const row of rows || []) {
      const recommendedId = String((row as any).recommended_product_id ?? '').trim()
      if (!recommendedId || sourceIds.includes(recommendedId)) continue
      const pairCount = Number((row as any).pair_count ?? 0)
      const prev = scoreMap.get(recommendedId) ?? 0
      scoreMap.set(recommendedId, prev + (Number.isFinite(pairCount) ? pairCount : 0))
    }

    const rankedIds = Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id]) => Number(id))
      .filter((id) => Number.isFinite(id))

    if (rankedIds.length === 0) {
      return NextResponse.json({ products: [] })
    }

    const { data: products, error: productsError } = await supabase
      .from('demo_products')
      .select('product_id, product_name, department_id')
      .in('product_id', rankedIds)

    if (productsError) {
      console.error('[cart-cooccurrence] 상품 조회 실패:', productsError)
      return NextResponse.json({ error: '추천 상품 조회 실패' }, { status: 500 })
    }

    const productMap = new Map<number, any>(
      (products || []).map((p: any) => [Number(p.product_id), p])
    )
    const nowIso = new Date().toISOString()

    const orderedProducts = rankedIds
      .map((pid) => {
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
          pair_count: scoreMap.get(String(pid)) ?? 0,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ products: orderedProducts })
  } catch (error: any) {
    console.error('[cart-cooccurrence] 서버 오류:', error)
    return NextResponse.json(
      { error: error?.message || '서버 오류' },
      { status: 500 }
    )
  }
}
