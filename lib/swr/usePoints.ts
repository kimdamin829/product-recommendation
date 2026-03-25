'use client'
// 데모 환경에서는 포인트 기능을 비활성화한다.
// (UI는 남기되) 실제 API 호출을 하지 않기 위해 SWR 자체를 사용하지 않는다.

export interface UserPoints {
  total_points: number
  purchase_count?: number
}

export interface PointsHistoryItem {
  id: string
  type: string
  description: string | null
  points: number
  created_at: string
}

export interface PointsPending {
  pendingPoints: number
  pendingCount: number
}

/**
 * 보유 포인트 (결제/포인트 페이지에서 사용)
 * 포커스 복귀 시 재검증: 다른 탭에서 결제/리뷰 등 후 돌아오면 최신 포인트 반영
 */
export function usePoints() {
  return {
    totalPoints: 0,
    error: null,
    isLoading: false,
    mutate: async () => {},
  }
}

/**
 * 포인트 내역 (포인트 페이지)
 */
export function usePointsHistory(limit = 50) {
  void limit
  return {
    history: [] as PointsHistoryItem[],
    error: null,
    isLoading: false,
    mutate: async () => {},
  }
}

/**
 * 적립 예정 포인트 (포인트 페이지)
 */
export function usePointsPending() {
  // limit/pending param 없음: 단순히 포인트 기능 비활성화 상태 유지
  return {
    pendingPoints: 0,
    pendingCount: 0,
    error: null,
    isLoading: false,
    mutate: async () => {},
  }
}
