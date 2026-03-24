'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BottomNavbar from '@/components/layout/BottomNavbar'
import FreeShippingProgress from '@/components/common/FreeShippingProgress'
import PromotionModalWrapper from '@/components/common/PromotionModalWrapper'
import ProductCard from '@/components/product/ProductCard'
import { isSoldOut } from '@/lib/product/product-utils'
import { useCart } from '@/lib/cart'
import { Product } from '@/lib/supabase/supabase'
import CartHeader from './_components/CartHeader'
import DeliveryMethodSelector from './_components/DeliveryMethodSelector'
import CartItemList from './_components/CartItemList'
import OrderSummary from './_components/OrderSummary'
import LoginPromptModal from './_components/LoginPromptModal'

function CartPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const [nextPurchaseProducts, setNextPurchaseProducts] = useState<Product[]>([])
  
  const {
    mounted,
    items,
    user,
    isMobile,
    allSelected,
    groupedItems,
    showLoginPrompt,
    deliveryMethod,
    pickupTime,
    quickDeliveryArea,
    quickDeliveryTime,
    getTotalPrice,
    getSelectedItems,
    toggleSelect,
    toggleSelectGroup,
    toggleSelectAll,
    setDeliveryMethod,
    setPickupTime,
    setQuickDeliveryArea,
    setQuickDeliveryTime,
    setShowLoginPrompt,
    closeLoginPrompt,
    handleCheckout,
    handleGuestCheckout,
    removeCartItemWithDB,
    updateCartQuantityWithDB,
  } = useCart()

  useEffect(() => {
    if (!user?.id) {
      setNextPurchaseProducts([])
      return
    }
    let active = true
    const run = async () => {
      try {
        const res = await fetch('/api/recommendations/next-purchase', { cache: 'no-store' })
        const data = await res.json().catch(() => ({ products: [] }))
        if (!active) return
        setNextPurchaseProducts(Array.isArray(data?.products) ? data.products : [])
      } catch {
        if (active) setNextPurchaseProducts([])
      }
    }
    run()
    return () => {
      active = false
    }
  }, [user?.id])

  return (
    <div className="min-h-screen flex flex-col">
      {/* 모바일: 기존 장바구니 헤더 */}
      <div className="lg:hidden">
        <CartHeader />
      </div>
      {/* PC: 메인 헤더 + 메인메뉴 */}
      <div className="hidden lg:block">
        <Header showCartButton />
      </div>

      <main className="flex-1 container mx-auto max-w-4xl px-2 pt-2 lg:pt-6 pb-10 md:pb-32 lg:pb-40">
        <h2 className="hidden lg:block text-3xl font-bold text-center mb-8 text-primary-900 lg:mt-10">장바구니</h2>
        {items.length === 0 ? (
          <div className="text-center py-32 md:py-40">
            <p className="text-xl text-gray-600 mb-6">장바구니가 비어있습니다.</p>
            <button
              onClick={() => router.push('/products')}
              className="bg-white text-green-800 border border-green-800 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              쇼핑 계속하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* 장바구니 아이템 */}
            <div className="lg:col-span-3">
              <DeliveryMethodSelector
                deliveryMethod={deliveryMethod}
                onDeliveryMethodChange={setDeliveryMethod}
                pickupTime={pickupTime}
                onPickupTimeChange={setPickupTime}
                quickDeliveryArea={quickDeliveryArea}
                onQuickDeliveryAreaChange={setQuickDeliveryArea}
                quickDeliveryTime={quickDeliveryTime}
                onQuickDeliveryTimeChange={setQuickDeliveryTime}
              />

              {/* 전체 선택 체크박스 */}
              <div className="bg-white pt-4 pb-4 border-b border-gray-300">
                <div className="flex items-center pl-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="w-5 h-5 border-gray-300 focus:ring-green-800 accent-green-800"
                      style={{ accentColor: '#16a34a' }}
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">전체선택</span>
                  </label>
                </div>
              </div>

              {/* 무료배송 진행률 바 */}
              {deliveryMethod === 'regular' && (
                <div className="py-3 pb-4 border-b border-gray-300">
                  <FreeShippingProgress
                    totalPrice={getTotalPrice()}
                    deliveryMethod={deliveryMethod}
                  />
                </div>
              )}

              <CartItemList
                groupedItems={groupedItems}
                userId={user?.id}
                onToggleSelect={toggleSelect}
                onToggleSelectGroup={toggleSelectGroup}
                onRemoveItem={removeCartItemWithDB}
                onUpdateQuantity={updateCartQuantityWithDB}
              />
            </div>

            {/* 주문 요약 */}
            <div className="lg:col-span-2">
              {nextPurchaseProducts.length > 0 && (
                <section className="mb-3">
                  <h3 className="text-base font-bold text-gray-900 mb-3 pl-1">고객님이 좋아할 상품이에요</h3>
                  <div className="overflow-x-auto pb-1">
                    <div className="flex min-w-max gap-3 pl-1 pr-1">
                      {nextPurchaseProducts.map((item) => (
                        <div key={`next-purchase-${item.id}`} className="w-36 shrink-0">
                          <ProductCard product={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
              <div className="mt-6">
                <OrderSummary
                  selectedItems={getSelectedItems()}
                  deliveryMethod={deliveryMethod}
                  pickupTime={pickupTime}
                  quickDeliveryArea={quickDeliveryArea}
                  quickDeliveryTime={quickDeliveryTime}
                />
              </div>
              <div className="hidden lg:flex mt-2">
                <button
                  onClick={handleCheckout}
                  className="shrink-0 bg-green-800 text-white py-3 text-base font-medium hover:bg-green-800 border-0 flex-1 min-w-0"
                  suppressHydrationWarning
                >
                  주문하기 ({mounted ? getSelectedItems().filter(item => !isSoldOut(item.status)).reduce((total, item) => total + item.quantity, 0) : 0})
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 하단 고정 액션 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[480px] bg-white shadow-lg flex">
            <button
              onClick={handleCheckout}
              className="shrink-0 bg-green-800 text-white py-3 text-base font-medium hover:bg-green-800 border-0 flex-1 min-w-0"
              suppressHydrationWarning
            >
              주문하기 ({mounted ? getSelectedItems().filter(item => !isSoldOut(item.status)).reduce((total, item) => total + item.quantity, 0) : 0})
            </button>
          </div>
        </div>
      </div>

      <PromotionModalWrapper />

      <LoginPromptModal
        show={showLoginPrompt}
        onClose={closeLoginPrompt}
        onGuestCheckout={() => handleGuestCheckout()}
      />

      <Footer />
      {pathname !== '/cart' && <BottomNavbar />}
    </div>
  )
}

export default function CartPageClientWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800"></div>
      </div>
    }>
      <CartPageContent />
    </Suspense>
  )
}


