import { createSupabaseAdminClient } from '@/lib/supabase/supabase-server'
import { DEPARTMENT_ID_TO_CATEGORY } from '@/lib/utils/constants'

export type DemoProductListItem = {
  id: string
  slug: null
  brand: null
  name: string
  price: number
  image_url: null
  category: string
  average_rating: null
  review_count: number
  weight_gram: null
  status: 'active'
  tax_type: 'taxable'
  created_at: string
  updated_at: string
  promotion: null
}

export type ListDemoProductsParams = {
  page?: number
  limit?: number
  category?: string | null
  searchQuery?: string | null
}

export type ListDemoProductsResult = {
  products: DemoProductListItem[]
  total: number
  page: number
  totalPages: number
}

function mapDemoProductRow(p: {
  product_id: number
  product_name: string
  department_id: number
}): DemoProductListItem {
  return {
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
    created_at: '',
    updated_at: '',
    promotion: null,
  }
}

export async function listDemoProducts(
  params: ListDemoProductsParams = {}
): Promise<ListDemoProductsResult> {
  const page = Math.max(1, params.page ?? 1)
  const limit = Math.min(100, Math.max(1, params.limit ?? 20))
  const from = (page - 1) * limit

  const supabase = createSupabaseAdminClient()
  let query = supabase
    .from('demo_products')
    .select('product_id, product_name, department_id', { count: 'exact' })
    .order('product_id', { ascending: true })

  if (params.searchQuery) {
    query = query.ilike('product_name', `%${params.searchQuery}%`)
  }

  if (params.category) {
    const departmentId = Object.entries(DEPARTMENT_ID_TO_CATEGORY).find(
      ([, label]) => label === params.category
    )?.[0]
    if (departmentId) {
      query = query.eq('department_id', Number(departmentId))
    } else {
      query = query.eq('department_id', -1)
    }
  }

  query = query.range(from, from + limit - 1)

  const { data: products, error, count } = await query

  if (error) {
    throw new Error(error.message || '상품 조회 실패')
  }

  const total = count || 0
  return {
    products: (products || []).map(mapDemoProductRow),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
