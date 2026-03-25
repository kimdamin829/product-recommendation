'use client'

// 데모 환경에서는 쿠폰 기능을 비활성화한다.
// (UI는 남기되) 실제 API 호출을 하지 않기 위해 SWR 자체를 사용하지 않는다.

import type { UserCoupon } from '@/lib/supabase/supabase'

export interface CouponsResponse {
  coupons?: UserCoupon[]
  error?: string
}

/**
 * 사용자 쿠폰 목록 (보유/사용완료 탭에 따라)
 * 포커스 복귀 시 재검증: 다른 곳에서 쿠폰 사용 후 돌아오면 최신 반영
 */
export function useCoupons(includeUsed: boolean) {
  void includeUsed
  return {
    coupons: [] as UserCoupon[],
    error: null,
    isLoading: false,
    mutate: async () => {},
  }
}
