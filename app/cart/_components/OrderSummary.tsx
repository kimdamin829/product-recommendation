'use client'

import { CartItem } from '@/lib/store'
import { DeliveryMethod } from '@/lib/cart'

interface OrderSummaryProps {
  selectedItems: CartItem[]
  deliveryMethod: DeliveryMethod
  pickupTime: string
  quickDeliveryArea: string
  quickDeliveryTime: string
}

export default function OrderSummary({
  selectedItems,
  deliveryMethod,
  pickupTime,
  quickDeliveryArea,
  quickDeliveryTime,
}: OrderSummaryProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 sticky top-24 mb-40 lg:static lg:top-auto lg:mb-2">
      <h2 className="text-xl font-bold mb-4">주문 요약</h2>

      <div className="mb-2 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">배송 방법</span>
          <span className="font-semibold">
            {deliveryMethod === 'pickup' && '픽업'}
            {deliveryMethod === 'quick' && '퀵배송'}
            {deliveryMethod === 'regular' && '택배배송'}
          </span>
        </div>
        {deliveryMethod === 'pickup' && pickupTime && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-gray-600">픽업 시간</span>
            <span className="font-semibold">{pickupTime}</span>
          </div>
        )}
        {deliveryMethod === 'quick' && (
          <>
            {quickDeliveryArea && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-600">배달 지역</span>
                <span className="font-semibold">{quickDeliveryArea}</span>
              </div>
            )}
            {quickDeliveryTime && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-600">배달 시간</span>
                <span className="font-semibold">{quickDeliveryTime}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
