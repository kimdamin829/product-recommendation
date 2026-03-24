"use client"

import Link from 'next/link'
import { CATEGORIES } from '@/lib/utils/constants'
import { getCategoryPath } from '@/lib/category/category-utils'

interface CategoryGridProps {
  selectedCategory?: string
}

export default function CategoryGrid({ selectedCategory = '' }: CategoryGridProps) {
  return (
    <div className="w-full bg-gray-100">
      <div className="px-4 py-3">
        <div className="grid grid-cols-5 gap-x-4 gap-y-2">
          {CATEGORIES.map((cat, idx) => (
            <Link
              key={cat}
              href={getCategoryPath(cat)}
              prefetch={false}
              className="flex flex-col items-center"
            >
              <div className="relative w-[60px] h-[60px] rounded-2xl bg-gray-300 overflow-hidden hover:scale-110 transition flex items-center justify-center">
                <span className="text-[10px] font-semibold text-gray-700 text-center px-1 leading-tight">
                  {cat}
                </span>
              </div>
              <span
                className={`text-sm mt-1 ${
                  selectedCategory === cat ? 'font-black text-green-800' : 'font-medium text-gray-700'
                }`}
              >
                {cat}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

