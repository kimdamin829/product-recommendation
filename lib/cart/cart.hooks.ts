import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useCartStore } from '@/lib/store'
import { useAuth } from '@/lib/auth/auth-context'
import { formatPrice } from '@/lib/utils/utils'
import { useIsMobile } from '@/lib/device/useDevice'
import { useCartRealtimeSync } from '@/lib/cart/useCartRealtimeSync'
import { validateCheckout } from '@/lib/cart/checkout-validator'
import { isSoldOut } from '@/lib/product/product-utils'
import { removeCartItemWithDB, updateCartQuantityWithDB } from '@/lib/cart/cart-db'
import { DeliveryMethod } from './cart.types'

export function useCart() {
  const router = useRouter()
  const { user } = useAuth()
  const isMobile = useIsMobile()

  // Cart store
  const items = useCartStore((state) => state.items)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const toggleSelect = useCartStore((state) => state.toggleSelect)
  const toggleSelectGroup = useCartStore((state) => state.toggleSelectGroup)
  const toggleSelectAll = useCartStore((state) => state.toggleSelectAll)
  const getSelectedItems = useCartStore((state) => state.getSelectedItems)

  // State
  const [mounted, setMounted] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('regular')
  const [pickupTime, setPickupTime] = useState('')
  const [quickDeliveryArea, setQuickDeliveryArea] = useState('')
  const [quickDeliveryTime, setQuickDeliveryTime] = useState('')

  // Hydration guard
  useEffect(() => {
    setMounted(true)
  }, [])

  // Realtime sync
  const productIds = useMemo(() => items.map(item => item.productId).filter(Boolean).sort(), [items])
  const productIdsString = productIds.join(',')
  useCartRealtimeSync(user?.id, productIdsString)

  // Computed
  const allSelected = useMemo(
    () => items.length > 0 && items.every((item) => item.selected !== false),
    [items]
  )

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: typeof items } = {}
    const standalone: typeof items = []
    const soldOutItems: typeof items = []
    
    items.forEach(item => {
      if (isSoldOut(item.status)) {
        soldOutItems.push(item)
        return
      }
      
      if (item.promotion_group_id) {
        if (!groups[item.promotion_group_id]) {
          groups[item.promotion_group_id] = []
        }
        groups[item.promotion_group_id].push(item)
      } else {
        standalone.push(item)
      }
    })
    
    return { groups, standalone, soldOutItems }
  }, [items])

  // Handlers
  const handleCheckout = useCallback(() => {
    const selectedItems = getSelectedItems()

    const validation = validateCheckout({
      selectedItems,
      deliveryMethod,
      pickupTime,
      quickDeliveryArea,
      quickDeliveryTime,
    })

    if (!validation.valid) {
      toast.error(validation.error || '주문 정보를 확인해주세요.', { duration: 3000 })
      return
    }

    if (!user) {
      setShowLoginPrompt(true)
      return
    }

    goToCheckout()
  }, [getSelectedItems, user, deliveryMethod, pickupTime, quickDeliveryArea, quickDeliveryTime])

  const goToCheckout = useCallback(() => {
    sessionStorage.setItem('deliveryMethod', deliveryMethod)
    sessionStorage.setItem('pickupTime', pickupTime)
    sessionStorage.setItem('quickDeliveryArea', quickDeliveryArea)
    sessionStorage.setItem('quickDeliveryTime', quickDeliveryTime)
    // checkout 페이지를 제거했으므로 주문 목록으로 이동
    router.push('/orders')
  }, [router, deliveryMethod, pickupTime, quickDeliveryArea, quickDeliveryTime])

  const handleGuestCheckout = useCallback(() => {
    const selectedItems = getSelectedItems()

    const validation = validateCheckout({
      selectedItems,
      deliveryMethod,
      pickupTime,
      quickDeliveryArea,
      quickDeliveryTime,
    })

    if (!validation.valid) {
      toast.error(validation.error || '주문 정보를 확인해주세요.', { duration: 3000 })
      return
    }

    goToCheckout()
  }, [getSelectedItems, deliveryMethod, pickupTime, quickDeliveryArea, quickDeliveryTime, goToCheckout])

  const closeLoginPrompt = useCallback(() => {
    setShowLoginPrompt(false)
  }, [])

  return {
    // State
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
    // Computed
    getTotalPrice,
    getSelectedItems,
    // Handlers
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
    // Utils
    formatPrice,
  }
}


