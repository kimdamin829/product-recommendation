import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 쿠폰 발급 스텁(데모/비활성화).
 * 실제 쿠폰 지급/DB 반영은 하지 않음.
 */
export async function issuePhoneVerificationCoupon(params: {
  userId: string
  phone: string
  supabaseAdmin?: SupabaseClient
}): Promise<void> {
  void params
}

