'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { formatPrice } from '@/lib/utils/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { useDaumPostcodeScript } from '@/lib/postcode/useDaumPostcode'
import { Coupon } from '@/lib/supabase/supabase'
import { useCheckout } from '@/lib/checkout'
import DeliveryMethodSelector from '@/app/cart/_components/DeliveryMethodSelector'
import type { DeliveryMethod } from '@/lib/cart'
import {
  CheckoutHeader,
  CouponModal,
  OrdererInfo,
  DeliveryFormQuick,
  DeliveryFormRegular,
  OrderSummaryBox,
  CheckoutBottomBar,
} from './_components'

function CheckoutPageContent() {
  const router = useRouter()
  const { user } = useAuth()

  const { state, actions, derived } = useCheckout()

  const {
    deliveryState,
    formData,
    flags,
    availableCoupons,
    selectedCoupon,
    showCouponModal,
    loadingCoupons,
    userPoints,
    usedPoints,
    loadingPoints,
    usedPointsInput,
    items,
    isDirectPurchase,
  } = state

  const {
    setDeliveryState,
    setFormData,
    setFlags,
    setSelectedCoupon,
    setShowCouponModal,
    setUsedPoints,
    setUsedPointsInput,
    handleSubmit,
    handleSearchAddress,
    loadUserPoints,
    applyAddress,
    handleInputChange,
  } = actions

  const {
    deliveryMethod,
    pickupTime,
    quickDeliveryArea,
    quickDeliveryTime,
    isProcessing,
    mounted,
    saveAsDefaultAddress,
    gridColumnsClass,
    originalTotal,
    discountAmount,
    shipping,
    discountedTotal,
    orderTotal,
    subtotal,
    couponDiscount,
    afterCouponDiscount,
    finalTotal,
    pickupTimeSlots,
    quickDeliveryAreas,
    quickDeliveryTimeSlots,
    defaultAddress,
    loadingDefaultAddress,
    hasDefaultAddress,
    userProfile,
    loadingUserProfile,
  } = derived

  useDaumPostcodeScript()

  useEffect(() => {
    if (defaultAddress) {
      applyAddress(defaultAddress)
    } else if (!hasDefaultAddress) {
      setFlags((prev) => ({ ...prev, saveAsDefaultAddress: true }))
    }
  }, [defaultAddress, hasDefaultAddress, applyAddress, setFlags])

  useEffect(() => {
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || userProfile.name || '',
        phone: prev.phone || userProfile.phone || '',
      }))
    }
  }, [userProfile, setFormData])

  if (loadingDefaultAddress) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
          <div className="container mx-auto px-2 h-14 md:h-16 relative flex items-center">
            <button
              onClick={() => router.back()}
              aria-label="뒤로가기"
              className="p-2 text-gray-700 hover:text-gray-900"
            >
              <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <h1 className="text-lg md:text-xl font-normal text-gray-900 whitespace-nowrap">주문/결제</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-4">
          <div className="animate-pulse space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="space-y-3">
                <div className="h-20 bg-gray-100 rounded-lg" />
                <div className="h-20 bg-gray-100 rounded-lg" />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="lg:hidden">
        <CheckoutHeader />
      </div>
      <div className="hidden lg:block">
        <Header showCartButton />
      </div>

      <main className="flex-1 container mx-auto max-w-4xl px-2 pt-4 pb-10 md:pb-32 lg:pb-40">
        <h2 className="hidden lg:block text-3xl font-bold text-center mb-8 text-primary-900 lg:mt-10">주문/결제</h2>
        <form id="checkout-form" onSubmit={handleSubmit}>
          <div className={`grid grid-cols-1 ${gridColumnsClass} gap-4`}>
            <div className="space-y-3 lg:col-span-2">
              <OrdererInfo
                formData={formData}
                onInputChange={handleInputChange}
                onPhoneChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
              />

              <DeliveryMethodSelector
                deliveryMethod={deliveryMethod as DeliveryMethod}
                onDeliveryMethodChange={(method) =>
                  setDeliveryState((prev) => ({
                    ...prev,
                    method,
                    pickupTime: method === 'pickup' ? prev.pickupTime : '',
                    quickDeliveryArea: method === 'quick' ? prev.quickDeliveryArea : '',
                    quickDeliveryTime: method === 'quick' ? prev.quickDeliveryTime : '',
                  }))
                }
                pickupTime={pickupTime}
                onPickupTimeChange={(time) => setDeliveryState((prev) => ({ ...prev, pickupTime: time }))}
                quickDeliveryArea={quickDeliveryArea}
                onQuickDeliveryAreaChange={(area) => setDeliveryState((prev) => ({ ...prev, quickDeliveryArea: area }))}
                quickDeliveryTime={quickDeliveryTime}
                onQuickDeliveryTimeChange={(time) => setDeliveryState((prev) => ({ ...prev, quickDeliveryTime: time }))}
              />

              {deliveryMethod === 'quick' && (
                <DeliveryFormQuick
                  formData={formData}
                  hasDefaultAddress={hasDefaultAddress}
                  saveAsDefaultAddress={saveAsDefaultAddress}
                  isGuest={!user}
                  onSearchAddress={handleSearchAddress}
                  onInputChange={handleInputChange}
                  onSaveAsDefaultChange={(checked) => setFlags((prev) => ({ ...prev, saveAsDefaultAddress: checked }))}
                />
              )}

              {deliveryMethod === 'regular' && (
                <DeliveryFormRegular
                  formData={formData}
                  defaultAddress={defaultAddress}
                  hasDefaultAddress={hasDefaultAddress}
                  saveAsDefaultAddress={saveAsDefaultAddress}
                  isGuest={!user}
                  onSearchAddress={handleSearchAddress}
                  onInputChange={handleInputChange}
                  onSaveAsDefaultChange={(checked) => setFlags((prev) => ({ ...prev, saveAsDefaultAddress: checked }))}
                />
              )}

              {user && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h2 className="text-lg font-bold mb-3">쿠폰</h2>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowCouponModal(true)}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg text-left hover:border-primary-500 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          {selectedCoupon ? (
                            <>
                              <div className="font-medium text-gray-900">{(selectedCoupon.coupon as Coupon)?.name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {couponDiscount > 0 && `-${formatPrice(couponDiscount)}원 할인`}
                              </div>
                            </>
                          ) : (
                            <div className="text-gray-600">사용 가능한 쿠폰 {availableCoupons.length}개</div>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                    {selectedCoupon && (
                      <button
                        type="button"
                        onClick={() => setSelectedCoupon(null)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        쿠폰 취소
                      </button>
                    )}
                  </div>
                </div>
              )}

              {user && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h2 className="text-lg font-bold mb-3">포인트</h2>
                  {loadingPoints ? (
                    <div className="text-sm text-gray-500">포인트 조회 중...</div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">보유 포인트</span>
                        <span className="text-sm font-semibold text-primary-900">{userPoints.toLocaleString()}P</span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">사용할 포인트</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={usedPointsInput}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '')
                              setUsedPointsInput(raw)
                            }}
                            onBlur={() => {
                              const parsed = parseInt(usedPointsInput || '0', 10) || 0
                              const maxPoints = Math.min(userPoints, Math.max(0, afterCouponDiscount))
                              setUsedPoints(Math.min(parsed, maxPoints))
                            }}
                            className="flex-1 px-1.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const maxPoints = Math.min(userPoints, Math.max(0, afterCouponDiscount))
                              setUsedPoints(maxPoints)
                              setUsedPointsInput(String(maxPoints))
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                          >
                            전액사용
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          최대 {Math.min(userPoints, Math.max(0, afterCouponDiscount)).toLocaleString()}P 사용 가능
                        </p>
                      </div>
                      {usedPoints > 0 && (
                        <button
                          type="button"
                          onClick={() => setUsedPoints(0)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          포인트 사용 취소
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-bold mb-3">결제</h2>
                <p className="text-sm text-gray-600">
                  이 사이트는 테스트용입니다. 실제 결제(PG) 없이 주문만 생성됩니다.
                </p>
              </div>
            </div>

            <div className="lg:col-span-1">
              <OrderSummaryBox
                deliveryMethod={deliveryMethod}
                pickupTime={pickupTime}
                quickDeliveryArea={quickDeliveryArea}
                quickDeliveryTime={quickDeliveryTime}
                mounted={mounted}
                originalTotal={originalTotal}
                discountAmount={discountAmount}
                couponDiscount={couponDiscount}
                usedPoints={usedPoints}
                shipping={shipping}
                finalTotal={finalTotal}
              />
              {mounted && (
                <div className="hidden lg:block mt-2">
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={isProcessing}
                    className="w-full text-lg font-bold bg-green-800 text-white hover:bg-blue-950 py-3 transition disabled:bg-gray-400 disabled:text-gray-500 flex items-center justify-center gap-2"
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
              )}
            </div>
          </div>
        </form>

        {mounted && (
          <div className="lg:hidden">
            <CheckoutBottomBar
              isProcessing={isProcessing}
              finalTotal={finalTotal}
              shipping={shipping}
            />
          </div>
        )}
      </main>

      <CouponModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        availableCoupons={availableCoupons}
        selectedCoupon={selectedCoupon}
        onSelectCoupon={setSelectedCoupon}
        loadingCoupons={loadingCoupons}
        subtotal={subtotal}
      />

      <Footer />
    </div>
  )
}

export default function CheckoutPageClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-gray-50">
          <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
            <div className="container mx-auto px-2 h-14 md:h-16 relative flex items-center">
              <button aria-label="뒤로가기" className="p-2 text-gray-700 hover:text-gray-900">
                <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <h1 className="text-lg md:text-xl font-normal text-gray-900 whitespace-nowrap">주문/결제</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 container mx-auto px-4 py-8 pb-24">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </div>
              </div>
            </div>
          </main>
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  )
}
