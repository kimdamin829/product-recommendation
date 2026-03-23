'use client'

import { usePathname } from 'next/navigation'
import { SWRConfig } from 'swr'
import { AuthProvider } from '@/lib/auth/auth-context'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')
  
  const content = isAdminPage ? (
    <AuthProvider>
      {children}
    </AuthProvider>
  ) : (
    <AuthProvider>
      <div className="w-full flex justify-center bg-white">
        <div className="w-full max-w-[480px] bg-white">
          {children}
        </div>
      </div>
    </AuthProvider>
  )

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 2000,
      }}
    >
      {content}
    </SWRConfig>
  )
}

