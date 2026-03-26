import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BottomNavbar from '@/components/layout/BottomNavbar'
import ScrollToTop from '@/components/common/ScrollToTop'
import PromotionModalWrapper from '@/components/common/PromotionModalWrapper'
import CategoryGrid from '@/components/sections/CategoryGrid'
import HomeTasteSection from '@/components/sections/HomeTasteSection'
import ProductCard from '@/components/product/ProductCard'
import { getServerBaseUrl } from '@/lib/utils/server-url'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let products: any[] = []

  try {
    const siteUrl = await getServerBaseUrl()
    const baseUrl = siteUrl || (typeof window === 'undefined' ? process.env.NEXT_PUBLIC_SITE_URL : '')

    if (baseUrl) {
      const productsRes = await fetch(`${baseUrl}/api/products?page=1&limit=60`, {
        next: { revalidate: 60 },
      })
      if (productsRes.ok) {
        const data = await productsRes.json()
        products = data.products || []
      }
    }
  } catch (error: any) {
    // 빌드 시점 연결 실패는 무시 (정상적인 동작)
    // ECONNREFUSED 에러는 조용히 무시
    const isConnectionRefused = 
      error?.code === 'ECONNREFUSED' || 
      error?.cause?.code === 'ECONNREFUSED' ||
      error?.errno === -111 ||
      error?.cause?.errno === -111
    
    if (!isConnectionRefused) {
      console.error('메인 상품 조회 실패:', error)
    }
    // 에러 시 빈 배열로 fallback
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="p-0">
          <div className="relative w-full overflow-hidden bg-gray-200 aspect-[1500/1100]">
            <Image
              src="/images/hero/hero-1.jpg"
              alt="메인 히어로 배너"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 480px) 100vw, 480px"
            />
          </div>
        </section>

        <section className="pt-0 pb-0 bg-gray-100">
          <CategoryGrid selectedCategory="" />
        </section>

        <HomeTasteSection />

        <section className="px-4 py-3 pb-24">
          <h2 className="text-lg font-bold text-gray-900 mb-3">전체 상품</h2>
          {products.length === 0 ? (
            <div className="text-sm text-gray-500">등록된 상품이 없습니다.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>

      <ScrollToTop />
      <Footer />
      <BottomNavbar />
      <PromotionModalWrapper />
    </div>
  )
}

