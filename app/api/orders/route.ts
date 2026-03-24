import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase-server'
import { requireActiveUserFromServer } from '@/lib/auth/auth-server'
import { usePoints } from '@/lib/point/points'
export const dynamic = 'force-dynamic'

// GET: 사용자 주문 목록 조회 (구매확정 여부 포함)
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    const monthsParam = searchParams.get('months')
    const months = monthsParam ? Math.min(36, Math.max(1, parseInt(monthsParam, 10) || 1)) : 1

    // 서버에서 사용자 인증 확인
    const authResult = await requireActiveUserFromServer()
    if ('error' in authResult) {
      const status = authResult.error === 'unauthorized' ? 401 : 403
      const errorMessage = authResult.error === 'unauthorized' ? '로그인이 필요합니다.' : '접근 권한이 없습니다.'
      return NextResponse.json({ error: errorMessage }, { status })
    }
    const user = authResult.user

    // demo 환경: demo_orders + demo_order_items 기반 주문내역
    // months 파라미터는 created_at 컬럼이 없어 적용하지 않고 최신 order_number 순으로 반환한다.
    void months
    const { data: demoOrders, error: ordersError } = await supabaseAdmin
      .from('demo_orders')
      .select('order_id, user_id, order_number')
      .eq('user_id', user.id)
      .order('order_number', { ascending: false })

    if (ordersError) {
      console.error('주문 목록 조회 실패:', ordersError)
      return NextResponse.json({ 
        error: '주문 목록 조회 실패', 
        details: ordersError.message 
      }, { status: 500 })
    }

    if (!demoOrders || demoOrders.length === 0) {
      return NextResponse.json({ orders: [] })
    }

    // 주문 상품 조회
    const orderIds = demoOrders.map((o: any) => o.order_id)
    const { data: demoOrderItems, error: itemsError } = await supabaseAdmin
      .from('demo_order_items')
      .select('id, order_id, product_id, add_to_cart_order')
      .in('order_id', orderIds)
      .order('add_to_cart_order', { ascending: true })

    if (itemsError) {
      console.error('주문 상품 조회 실패:', itemsError)
    }

    const productIds = Array.from(
      new Set((demoOrderItems || []).map((item: any) => Number(item.product_id)).filter((id: number) => Number.isFinite(id)))
    )
    const { data: demoProducts } = productIds.length
      ? await supabaseAdmin
          .from('demo_products')
          .select('product_id, product_name')
          .in('product_id', productIds)
      : { data: [] as any[] }

    const productNameMap = new Map<number, string>(
      (demoProducts || []).map((p: any) => [Number(p.product_id), p.product_name || '상품'])
    )

    const itemsMap = (demoOrderItems || []).reduce((acc: any, item: any) => {
      const key = String(item.order_id)
      if (!acc[key]) acc[key] = []
      acc[key].push({
        id: String(item.id),
        order_id: String(item.order_id),
        product_id: String(item.product_id),
        quantity: 1,
        price: 0,
        product: {
          name: productNameMap.get(Number(item.product_id)) || '상품',
          image_url: null,
        },
      })
      return acc
    }, {})

    const now = Date.now()
    const orders = demoOrders.map((order: any, index: number) => {
      // order_number가 작을수록 과거 주문으로 보고 created_at을 보정
      const syntheticCreatedAt = new Date(now - (demoOrders.length - index) * 60_000).toISOString()
      return {
        id: String(order.order_id),
        user_id: String(order.user_id),
        order_number: String(order.order_number),
        total_amount: 0,
        status: 'CONFIRMED',
        delivery_type: 'regular',
        delivery_time: null,
        shipping_address: '',
        shipping_name: '',
        shipping_phone: '',
        delivery_note: null,
        tracking_number: null,
        tracking_company: null,
        is_gift: false,
        gift_token: null,
        gift_message: null,
        gift_expires_at: null,
        refund_completed_at: null,
        created_at: syntheticCreatedAt,
        updated_at: syntheticCreatedAt,
        order_items: itemsMap[String(order.order_id)] || [],
        is_confirmed: true,
      }
    })

    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error('주문 조회 오류:', error)
    return NextResponse.json({ 
      error: '서버 오류', 
      details: error?.message || '알 수 없는 오류'
    }, { status: 500 })
  }
}

// POST: 주문 생성 (금액은 서버에서 상품/수량/옵션 기준으로만 계산)
export async function POST(request: NextRequest) {
  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase/supabase-server')
    const supabaseAdmin = createSupabaseAdminClient()
    
    const authResult = await requireActiveUserFromServer()
    if ('error' in authResult) {
      const status = authResult.error === 'unauthorized' ? 401 : 403
      const errorMessage = authResult.error === 'unauthorized' ? '로그인이 필요합니다.' : '접근 권한이 없습니다.'
      return NextResponse.json({ error: errorMessage }, { status })
    }
    const user = authResult.user

    const body = await request.json()
    const {
      delivery_type,
      delivery_time,
      shipping_address,
      shipping_name,
      shipping_phone,
      delivery_note,
      used_coupon_id,
      used_points,
      is_gift,
      gift_message,
      items: rawItems
    } = body

    if (!rawItems || rawItems.length === 0) {
      return NextResponse.json({ error: '주문 상품이 없습니다.' }, { status: 400 })
    }

    const orderInput = {
      items: rawItems.map((item: { productId: string; quantity: number; promotion_group_id?: string | null }) => ({
        productId: item.productId,
        quantity: item.quantity,
        promotion_group_id: item.promotion_group_id ?? null,
      })),
      delivery_type: delivery_type || 'regular',
      delivery_time: delivery_time ?? null,
      shipping_address: shipping_address || '',
      shipping_name: shipping_name || '',
      shipping_phone: shipping_phone || '',
      delivery_note: delivery_note ?? null,
      used_coupon_id: used_coupon_id ?? null,
      used_points: Number(used_points) || 0,
      is_gift: false,
      gift_message: null,
    } as import('@/lib/order/order-pricing.server').OrderInput

    const { calculateOrderPricing } = await import('@/lib/order/order-pricing.server')
    const { pricing, itemSnapshots } = await calculateOrderPricing({
      supabaseAdmin,
      userId: user.id,
      input: orderInput,
    })

    const orderNumber = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const orderInsertData: any = {
      user_id: user.id,
      order_number: orderNumber,
      total_amount: pricing.finalTotal,
      tax_free_amount: pricing.taxFreeAmount ?? 0,
      points_used: pricing.appliedPoints ?? 0,
      coupon_discount_amount: pricing.couponDiscount ?? 0,
      status: 'ORDER_RECEIVED',
      delivery_type: orderInput.delivery_type,
      delivery_time: orderInput.delivery_time,
      shipping_address: orderInput.shipping_address,
      shipping_name: orderInput.shipping_name,
      shipping_phone: orderInput.shipping_phone,
      delivery_note: orderInput.delivery_note,
      is_gift: false,
      gift_message: null,
    }

    // 1. 주문 생성
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single()

    if (orderError || !order) {
      console.error('주문 생성 실패:', orderError)
      return NextResponse.json({ error: '주문 생성 실패', details: orderError?.message || '알 수 없는 오류' }, { status: 500 })
    }

    // 2. 주문 상품 생성 (서버 계산된 단가 사용)
    const orderItems = itemSnapshots.map((snapshot) => ({
      order_id: order.id,
      product_id: snapshot.product_id,
      quantity: snapshot.quantity,
      price: snapshot.final_unit_price ?? snapshot.price,
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('주문 상품 저장 실패:', itemsError)
      return NextResponse.json({ error: '주문 상품 저장 실패' }, { status: 500 })
    }

    // 3. 포인트 사용 처리
    if (pricing.appliedPoints > 0) {
      await usePoints(user.id, pricing.appliedPoints, order.id, `주문 #${orderNumber} 포인트 사용`, supabaseAdmin)
    }

    // 4. 쿠폰 사용 처리
    if (used_coupon_id && pricing.couponDiscount > 0) {
      await supabaseAdmin
        .from('user_coupons')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          order_id: order.id,
        })
        .eq('id', used_coupon_id)
        .eq('user_id', user.id)
    }

    // 5. 알림 생성
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: user.id,
        title: '주문이 완료되었습니다.',
        content: `주문번호 ${orderNumber}의 결제가 완료되었습니다.`,
        type: 'general',
        is_read: false,
        order_id: order.id
      })
    } catch (e) {
      console.error('알림 생성 실패:', e)
    }

    return NextResponse.json({ success: true, order })
  } catch (error: any) {
    console.error('주문 처리 예외:', error)
    return NextResponse.json({ 
      error: '서버 오류', 
      details: error?.message || '알 수 없는 오류'
    }, { status: 500 })
  }
}
