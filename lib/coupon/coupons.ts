import type { UserCoupon, Coupon } from '@/lib/supabase/supabase'

/**
 * 쿠폰 유효성 스텁.
 * - 모든 쿠폰을 유효하다고 처리
 * - validity period는 빈 값으로 반환
 *
 * 포인트/쿠폰 기능을 비활성화했으므로 UI만 남기고 API 호출/검증은 스킵합니다.
 */
export function isCouponValid(_userCoupon: UserCoupon, _coupon: Coupon): boolean {
  return true
}

export function getCouponValidityPeriod(_userCoupon: UserCoupon, _coupon: Coupon): {
  start: string
  end: string
} {
  return { start: '', end: '' }
}

