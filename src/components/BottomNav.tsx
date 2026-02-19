'use client'

import Link from 'next/link'
import { Home, Search, ShoppingCart } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCart } from './CartContext'

export const BottomNav = () => {
  const pathname = usePathname()
  const { cartCount } = useCart()

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden block pb-safe px-2 shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">Home</span>
        </Link>

        <Link
          href="/product"
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            // Just checking if we are on home but not necessarily checking the hash since usePathname doesn't include it
            isActive('/product') ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'
          }`}
        >
          <Search className="w-6 h-6" />
          <span className="text-xs font-medium">Products</span>
        </Link>

        <Link
          href="/checkout"
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative ${
            isActive('/checkout') ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">Cart</span>
        </Link>
      </div>
    </div>
  )
}
