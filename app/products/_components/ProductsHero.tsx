'use client'

import { ProductFilter } from '@/lib/product'

interface ProductsHeroProps {
  filter: ProductFilter
}

export default function ProductsHero({ filter }: ProductsHeroProps) {
  if (filter === 'flash-sale') return null

  const isBest = filter === 'best'

  return (
    <section className={`py-16 ${
      isBest ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white' :
      'bg-gradient-to-r from-green-800 to-green-800 text-white'
    }`}>
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold mb-2">
          {isBest ? '👑 베스트' : '🔥 특가'}
        </h1>
        <p className={`text-sm tracking-widest ${
          isBest ? 'text-yellow-100' : 'text-green-200'
        }`}>
          {isBest ? 'BEST SELLERS' : 'HOT DEALS'}
        </p>
      </div>
    </section>
  )
}

