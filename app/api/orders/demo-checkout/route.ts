import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase-server'
import { requireActiveUserFromServer } from '@/lib/auth/auth-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireActiveUserFromServer()
    if ('error' in authResult) {
      const status = authResult.error === 'unauthorized' ? 401 : 403
      const errorMessage = authResult.error === 'unauthorized' ? '로그인이 필요합니다.' : '접근 권한이 없습니다.'
      return NextResponse.json({ error: errorMessage }, { status })
    }

    const user = authResult.user
    const body = await request.json().catch(() => ({}))
    const rawItems = Array.isArray(body?.items) ? body.items : []

    const normalizedItems = rawItems
      .map((item: any) => ({
        productId: String(item?.productId ?? '').trim(),
        quantity: Math.max(1, Number(item?.quantity) || 1),
      }))
      .filter((item: { productId: string }) => item.productId.length > 0)

    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: '결제할 상품이 없습니다.' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdminClient()

    const { data: lastOrderRows, error: lastOrderError } = await supabaseAdmin
      .from('demo_orders')
      .select('order_id, order_number')
      .order('order_id', { ascending: false })
      .limit(1)

    if (lastOrderError) {
      console.error('[demo-checkout] 마지막 주문 조회 실패:', lastOrderError)
      return NextResponse.json({ error: '주문 생성 실패' }, { status: 500 })
    }

    const lastOrder = Array.isArray(lastOrderRows) && lastOrderRows.length > 0 ? lastOrderRows[0] : null
    const nextOrderId = Number(lastOrder?.order_id ?? 0) + 1
    const nextOrderNumber = Number(lastOrder?.order_number ?? 0) + 1

    const { error: insertOrderError } = await supabaseAdmin.from('demo_orders').insert({
      order_id: nextOrderId,
      user_id: user.id,
      order_number: nextOrderNumber,
    })

    if (insertOrderError) {
      console.error('[demo-checkout] 주문 저장 실패:', insertOrderError)
      return NextResponse.json({ error: '주문 생성 실패' }, { status: 500 })
    }

    const orderItems: Array<{ order_id: number; product_id: number; add_to_cart_order: number }> = []
    let seq = 1
    for (const item of normalizedItems) {
      const productId = Number(item.productId)
      if (!Number.isFinite(productId)) continue
      for (let i = 0; i < item.quantity; i += 1) {
        orderItems.push({
          order_id: nextOrderId,
          product_id: productId,
          add_to_cart_order: seq,
        })
        seq += 1
      }
    }

    if (orderItems.length > 0) {
      const { error: insertItemsError } = await supabaseAdmin
        .from('demo_order_items')
        .insert(orderItems)

      if (insertItemsError) {
        console.error('[demo-checkout] 주문 상품 저장 실패:', insertItemsError)
        return NextResponse.json({ error: '주문 상품 저장 실패' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        order_id: nextOrderId,
        order_number: nextOrderNumber,
      },
    })
  } catch (error: any) {
    console.error('[demo-checkout] 서버 오류:', error)
    return NextResponse.json({ error: error?.message || '서버 오류' }, { status: 500 })
  }
}
