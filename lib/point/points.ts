import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 포인트 기능 비활성화용 스텁.
 * - 호출은 받아도 실제 DB/로직 처리는 하지 않음
 * - 다른 코드가 기대하는 "시그니처/리턴 형태"는 맞춰서 컴파일을 통과시키기 위함
 */

export async function usePoints(
  _userId: string,
  _points: number,
  _orderId: string,
  _description: string,
  _supabaseAdmin?: SupabaseClient
): Promise<boolean> {
  return true
}

/**
 * addPoints 호출 시그니처(프로젝트 내 사용처 기준)
 * - app/api/orders/confirm: addPoints(userId, points, type, description, orderId, undefined, supabase)
 * - app/api/reviews:      addPoints(userId, points, type, description, undefined, reviewId, supabase)
 */
export async function addPoints(
  _userId: string,
  _points: number,
  _type: string,
  _description: string,
  _orderId?: string,
  _relatedId?: string,
  _supabaseAdmin?: SupabaseClient
): Promise<boolean> {
  return true
}

export async function handleOrderCancellationPoints(
  _userId: string,
  _orderId: string,
  _totalAmount: number,
  _usedPoints: number
): Promise<{ deducted: number; refunded: number }> {
  return { deducted: 0, refunded: 0 }
}
