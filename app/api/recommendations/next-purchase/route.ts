import { NextResponse } from 'next/server'
import { requireActiveUserFromServer } from '@/lib/auth/auth-server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authResult = await requireActiveUserFromServer()
    if ('error' in authResult) {
      return NextResponse.json({ products: [] })
    }
    const user = authResult.user

    const supabase = createSupabaseAdminClient()

    const { data: rows, error } = await supabase
      .from('next_purchase_recommendations')
      .select('product_id, rank')
      .eq('user_id', user.id)
      .order('rank', { ascending: true })
      .limit(20)

    if (error) {
      console.error('[next-purchase] 추천 조회 실패:', error)
      return NextResponse.json({ products: [] })
    }

    const ranked = rows || []
    const productIds = ranked
      .map((r: any) => Number(r.product_id))
      .filter((n: number) => Number.isFinite(n))

    if (productIds.length === 0) {
      return NextResponse.json({ products: [] })
    }

    const { data: products, error: productsError } = await supabase
      .from('demo_products')
      .select('product_id, product_name, department_id')
      .in('product_id', productIds)

    if (productsError) {
      console.error('[next-purchase] 상품 조회 실패:', productsError)
      return NextResponse.json({ products: [] })
    }

    const productMap = new Map<number, any>(
      (products || []).map((p: any) => [Number(p.product_id), p])
    )
    const nowIso = new Date().toISOString()
    const orderedProducts = ranked
      .map((row: any) => {
        const p = productMap.get(Number(row.product_id))
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
  } catch (error) {
    console.error('[next-purchase] 서버 오류:', error)
    return NextResponse.json({ products: [] })
  }
}

