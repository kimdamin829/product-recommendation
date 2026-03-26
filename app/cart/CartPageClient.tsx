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
import toast from 'react-hot-toast'
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
  const [showCooccurrenceModal, setShowCooccurrenceModal] = useState(false)
  const [cooccurrenceProducts, setCooccurrenceProducts] = useState<Product[]>([])
  const [isLoadingCooccurrence, setIsLoadingCooccurrence] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  
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
    validateCheckoutAndPromptLogin,
    handleCheckout,
    handleGuestCheckout,
    removeCartItemWithDB,
    updateCartQuantityWithDB,
  } = useCart()

  const openCooccurrenceModal = async () => {
    if (!validateCheckoutAndPromptLogin()) return

    const selectedProductIds = getSelectedItems()
      .filter((item) => !isSoldOut(item.status))
      .map((item) => item.productId)
      .filter(Boolean)

    setShowCooccurrenceModal(true)
    setIsLoadingCooccurrence(true)
    try {
      const res = await fetch('/api/recommendations/cart-cooccurrence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedProductIds }),
      })
      const data = await res.json().catch(() => ({ products: [] }))
      setCooccurrenceProducts(Array.isArray(data?.products) ? data.products : [])
    } catch {
      setCooccurrenceProducts([])
      toast.error('추천 상품을 불러오지 못했습니다.')
    } finally {
      setIsLoadingCooccurrence(false)
    }
  }

  const handleMockPayment = async () => {
    const selectedItems = getSelectedItems().filter((item) => !isSoldOut(item.status))
    if (selectedItems.length === 0) {
      toast.error('결제할 상품이 없습니다.')
      return
    }

    setIsPaying(true)
    try {
      const res = await fetch('/api/orders/demo-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || '결제 처리에 실패했습니다.')
      }

      await Promise.all(
        selectedItems
          .filter((item) => !!item.id)
          .map((item) =>
            removeCartItemWithDB(user?.id || null, item.id as string, item.promotion_group_id, item.productId)
          )
      )

      setShowCooccurrenceModal(false)
      toast.success('결제가 완료되었습니다.')
      router.push('/orders')
    } catch (error: any) {
      toast.error(error?.message || '결제 처리에 실패했습니다.')
    } finally {
      setIsPaying(false)
    }
  }

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
                  onClick={openCooccurrenceModal}
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
              onClick={openCooccurrenceModal}
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

      {showCooccurrenceModal && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl max-h-[68vh] flex flex-col overflow-hidden">
            <div className="p-5 md:p-6 flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">함께 구매하면 좋아요</h3>
              <button
                type="button"
                aria-label="추천 모달 닫기"
                onClick={() => setShowCooccurrenceModal(false)}
                className="w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center justify-center"
              >
                X
              </button>
            </div>

            <div className="px-5 md:px-6 pb-4 overflow-y-auto">
              {isLoadingCooccurrence ? (
                <p className="text-sm text-gray-600 py-8 text-center">추천 상품을 불러오는 중입니다.</p>
              ) : cooccurrenceProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {cooccurrenceProducts.map((item) => (
                    <div key={`cart-cooccurrence-${item.id}`}>
                      <ProductCard product={item} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 py-8 text-center">추천할 상품이 아직 없어요.</p>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 md:px-6 md:py-4 flex gap-2">
              <button
                onClick={() => {
                  setShowCooccurrenceModal(false)
                  router.push('/products?category=전체')
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium"
              >
                쇼핑하기
              </button>
              <button
                onClick={handleMockPayment}
                disabled={isPaying}
                className="flex-1 bg-green-800 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-60"
              >
                {isPaying ? '결제 처리 중...' : '결제하기'}
              </button>
            </div>
          </div>
        </div>
      )}

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


