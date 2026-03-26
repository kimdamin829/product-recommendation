'use client'

import { useEffect, useState } from 'react'
import ProductCard from '@/components/product/ProductCard'
import { Product } from '@/lib/supabase/supabase'

export default function HomeTasteSection() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    let active = true

    const run = async () => {
      try {
        const res = await fetch('/api/recommendations/next-purchase', { cache: 'no-store' })
        const data = await res.json().catch(() => ({ products: [] }))
        if (!active) return
        setProducts(Array.isArray(data?.products) ? data.products : [])
      } catch {
        if (!active) return
        setProducts([])
      }
    }

    run()
    return () => {
      active = false
    }
  }, [])

  if (products.length === 0) return null

  return (
    <section className="px-4 pt-4 pb-2">
      <h2 className="text-lg font-bold text-gray-900 mb-3">고객님 취향에 딱 맞는 상품이에요</h2>
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-3">
          {products.map((item) => (
            <div key={`home-next-purchase-${item.id}`} className="w-36 shrink-0">
              <ProductCard product={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
