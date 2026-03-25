/**
 * demo 환경에서 결제 draft를 "주문"으로 확정하는 로직.
 *
 * 이번 작업의 목적이 포인트/쿠폰 비활성화 및 체크아웃 제거이므로,
 * 주문 확정까지 포함된 복잡한 로직을 스텁으로 처리합니다.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase-server'

const CONFIRM_STATUS = {
  APPROVED_NOT_PERSISTED: 'approved_not_persisted',
  DONE: 'done',
  FAILED: 'failed',
} as const

export interface PersistResult {
  ok: boolean
  order?: {
    id: string
    order_number: string | null
    user_id: string | null
    gift_token: string | null
    shipping_phone: string | null
    [key: string]: unknown
  }
  error?: string
}

export async function persistDraftToOrder(draftId: string): Promise<PersistResult> {
  const supabaseAdmin: SupabaseClient = createSupabaseAdminClient()

  try {
    const { data: draft, error } = await supabaseAdmin
      .from('order_drafts')
      .select('id, user_id, confirm_status')
      .eq('id', draftId)
      .maybeSingle()

    if (error || !draft) {
      return { ok: false, error: 'draft_not_found' }
    }

    // 중복 처리 방지: 이미 DONE/처리중이면 성공으로 반환
    if (draft.confirm_status !== CONFIRM_STATUS.APPROVED_NOT_PERSISTED) {
      return { ok: true }
    }

    // 스텁: 주문/주문상품 insert 없이 draft 상태만 DONE 처리
    await supabaseAdmin
      .from('order_drafts')
      .update({ confirm_status: CONFIRM_STATUS.DONE })
      .eq('id', draftId)

    return { ok: true }
  } catch (e) {
    // 에러 시 FAILED로 마킹 (스텁 안정성)
    try {
      await supabaseAdmin
        .from('order_drafts')
        .update({ confirm_status: CONFIRM_STATUS.FAILED })
        .eq('id', draftId)
    } catch {
      // ignore secondary failure
    }

    return { ok: false, error: e instanceof Error ? e.message : 'unknown_error' }
  }
}

