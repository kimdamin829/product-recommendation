export async function fetchCartItemsForUser(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('demo_cart')
    .select('id, user_id, product_id, quantity, added_at')
    .eq('user_id', userId)
    .order('added_at', { ascending: false })

  if (error) {
    throw error
  }

  const productIds = Array.from(
    new Set((data || []).map((item: any) => Number(item.product_id)).filter((id: number) => Number.isFinite(id)))
  )

  let productMap = new Map<number, any>()
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('demo_products')
      .select('product_id, product_name')
      .in('product_id', productIds)
    productMap = new Map((products || []).map((p: any) => [Number(p.product_id), p]))
  }

  return (data || [])
    .map((item: any) => {
      const productIdNum = Number(item.product_id)
      const product = productMap.get(productIdNum)
      if (!product) return null
      return {
        id: String(item.id),
        productId: String(item.product_id),
        slug: null,
        name: product.product_name || '',
        price: 0,
        weightGram: null,
        quantity: item.quantity || 1,
        imageUrl: null,
        discount_percent: 0,
        brand: null,
        selected: true,
        status: 'active',
      }
    })
    .filter(Boolean)
}
