'use client'

import { formatPrice } from '@/lib/utils/utils'

interface CheckoutBottomBarProps {
  isProcessing: boolean
  finalTotal: number
  shipping: number
}

export default function CheckoutBottomBar({
  isProcessing,
  finalTotal,
  shipping,
}: CheckoutBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[480px] bg-white shadow-lg">
          <div className="px-0 pb-0">
            <button
              type="submit"
              form="checkout-form"
              disabled={isProcessing}
              className="w-full text-lg font-bold transition disabled:bg-gray-400 disabled:text-gray-500 flex items-center justify-center gap-2 bg-green-800 text-white hover:bg-blue-950 py-3"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  처리 중...
                </>
              ) : (
                <span>{formatPrice(finalTotal + shipping)}원 테스트 주문하기</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
