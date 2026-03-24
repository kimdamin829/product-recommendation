import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase-server'
import { DEPARTMENT_ID_TO_CATEGORY } from '@/lib/utils/constants'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('demo_products')
      .select('product_id, product_name, department_id')
      .eq('product_id', Number(id))
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({
      id: String(data.product_id),
      slug: null,
      brand: null,
      name: data.product_name,
      price: 0,
      image_url: null,
      category: DEPARTMENT_ID_TO_CATEGORY[data.department_id as number] || 'other',
      average_rating: null,
      review_count: 0,
      weight_gram: null,
      status: 'active',
      tax_type: 'taxable',
      promotion: null,
    })
  } catch (error: any) {
    console.error('[API/products/[id]] 상품 조회 실패:', error)
    console.error('[API/products/[id]] 상품 ID:', id)
    console.error('[API/products/[id]] 에러 코드:', error?.code)
    console.error('[API/products/[id]] 에러 메시지:', error?.message)
    return NextResponse.json({ error: '상품 조회 실패' }, { status: 500 })
  }
}




