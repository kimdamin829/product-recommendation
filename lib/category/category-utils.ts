/**
 * 카테고리 관련 유틸리티 함수
 */

import { CATEGORIES } from '../utils/constants'

/**
 * 카테고리명을 slug로 변환
 */
export function categoryToSlug(category: string): string | null {
  if (category === '전체') return null
  if (!CATEGORIES.includes(category as any)) return null
  return encodeURIComponent(category)
}

/**
 * slug를 카테고리명으로 변환
 */
export function slugToCategory(slug: string): string | null {
  const decoded = decodeURIComponent(slug)
  return CATEGORIES.includes(decoded as any) ? decoded : null
}

/**
 * 유효한 카테고리 slug인지 확인
 */
export function isValidCategorySlug(slug: string): boolean {
  const decoded = decodeURIComponent(slug)
  return CATEGORIES.includes(decoded as any)
}

/**
 * 카테고리 경로 생성
 */
export function getCategoryPath(category: string): string {
  if (category === '전체') return '/products'
  if (!CATEGORIES.includes(category as any)) return '/products'
  return `/products?category=${encodeURIComponent(category)}`
}

