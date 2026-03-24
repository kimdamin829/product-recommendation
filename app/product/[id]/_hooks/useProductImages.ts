'use client'

import { useState, useEffect, useRef } from 'react'
import { Product } from '@/lib/supabase/supabase'

export interface ProductImage {
  id: string
  image_url: string
  priority: number
}

export interface UseProductImagesReturn {
  images: ProductImage[]
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  handlePrevious: () => void
  handleNext: () => void
  handleSwipe: (direction: 'left' | 'right') => void
}

export function useProductImages(
  product: Product | null,
  initialImages?: ProductImage[]
): UseProductImagesReturn {
  const [images, setImages] = useState<ProductImage[]>(initialImages ?? [])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const initialProductIdRef = useRef<string | null>(product?.id ?? null)
  const initialImagesRef = useRef<ProductImage[] | undefined>(initialImages)

  useEffect(() => {
    if (!product?.id) {
      setImages([])
      return
    }

    const shouldUseInitial =
      initialImagesRef.current &&
      initialProductIdRef.current === product.id

    if (shouldUseInitial) {
      setImages(initialImagesRef.current || [])
      return
    }

    // demo 스키마에서는 product_images를 사용하지 않으므로 이미지 목록은 비움
    setImages([])
  }, [product?.id])

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  const handleNext = () => {
    if (selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    } else if (direction === 'right' && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  return {
    images,
    selectedIndex,
    setSelectedIndex,
    handlePrevious,
    handleNext,
    handleSwipe,
  }
}

