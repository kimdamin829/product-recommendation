/**
 * 공통 상수 정의
 */

// ==================== Categories ====================

export const CATEGORIES = [
  '전체',
  '냉동식품',
  '베이커리',
  '야채/과일',
  '음료',
  '파스타',
  '육류/해산',
  '양념/소스',
  '아침식사',
  '통조림',
  '우유/달걀',
  '가정용품',
  '유아용품',
  '간식',
  '즉석식품',
] as const

export const DEPARTMENT_ID_TO_CATEGORY: Record<number, string> = {
  1: '냉동식품',
  3: '베이커리',
  4: '야채/과일',
  7: '음료',
  9: '파스타',
  12: '육류/해산',
  13: '양념/소스',
  14: '아침식사',
  15: '통조림',
  16: '우유/달걀',
  17: '가정용품',
  18: '유아용품',
  19: '간식',
  20: '즉석식품',
}

// 관리자용 (전체 제외) - 동적으로 생성
export const ADMIN_CATEGORIES = CATEGORIES

// ==================== Menu ====================

// 메인 메뉴 (첫 번째 줄)
export const MAIN_MENU_LINKS = [
  { name: '홈', href: '/' },
  { name: '리뷰이벤트', href: '/review-event' },
]

// 카테고리 메뉴 (두 번째 줄) - 동적으로 생성
// 주의: 이 상수는 동적 import가 필요한 경우를 위해 유지하지만,
// 실제 링크는 getCategoryPath() 함수를 사용하는 것을 권장합니다.
export const CATEGORY_LINKS = CATEGORIES.map(category => ({
  name: category,
  href: `/products?category=${encodeURIComponent(category)}`,
}))

// ==================== Order Status ====================

export const VALID_ORDER_STATUSES = [
  'pending', 
  'ORDER_RECEIVED',      // 주문완료
  'PREPARING',           // 상품준비중
  'IN_TRANSIT',          // 배송중
  'DELIVERED',           // 배송완료
  'CONFIRMED',           // 구매확정
  'cancelled',
  'payment_error',       // 결제 검증 실패
] as const
export const VALID_DELIVERY_TYPES = ['pickup', 'quick', 'regular'] as const

// ==================== Delivery ====================

// 배송비 및 무료배송 기준
export const SHIPPING = {
  FREE_THRESHOLD: 50000,    // 무료배송 기준 금액
  DEFAULT_FEE: 3000,        // 기본 배송비
  QUICK_FEE: 5000,          // 퀵배송 추가 요금
} as const

// 픽업 시간대 (오전 9시 ~ 오후 9시, 1시간 단위)
export const PICKUP_TIME_SLOTS = [
  '9:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
]

// 퀵배달 지역
export const QUICK_DELIVERY_AREAS = [
  '연향동', '조례동', '풍덕동', '해룡면'
]

// 퀵배달 시간대
export const QUICK_DELIVERY_TIME_SLOTS = [
  '오후 3시~5시'
]

// ==================== Pagination ====================

export const DEFAULT_PAGE_SIZE = 20
// 관리자 페이지도 같은 페이지 크기 사용
export const ADMIN_PAGE_SIZE = DEFAULT_PAGE_SIZE

// ==================== Promotion ====================

export const PROMOTION_TYPES = ['1+1', '2+1', '3+1'] as const
export type PromotionType = typeof PROMOTION_TYPES[number]

// ==================== Gift ====================

// 선물하기 최소 금액
export const GIFT_MIN_AMOUNT = 50000

// ==================== Payment Draft ====================

/** 주문 초안(draft) 만료 시간(분). 이 시간 내 미결제 시 confirm 시 400 */
export const DRAFT_EXPIRY_MINUTES = 30

