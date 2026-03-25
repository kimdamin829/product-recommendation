'use client'

import { useState } from 'react'

export interface UseProductReviewsReturn {
  reviewCount: number
  averageRating: number
  refetch: () => Promise<void>
}

export function useProductReviews(productId: string | null): UseProductReviewsReturn {
  const [reviewCount, setReviewCount] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const fetchReviewCount = async () => {
    // demo 환경: 리뷰 조회를 사용하지 않음
    setReviewCount(0)
    setAverageRating(0)
    void productId
  }

  return {
    reviewCount,
    averageRating,
    refetch: fetchReviewCount,
  }
}

