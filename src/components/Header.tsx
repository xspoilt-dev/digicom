'use client'

import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, Phone, Menu } from 'lucide-react'
import Link from 'next/link'

import { useState, useRef, useEffect } from 'react'
import { Logo } from './Logo'
import { useCart } from './CartContext'
import CartDrawer from './CartDrawer'
import { MobileMenu } from './MobileMenu'
import type { Category } from '@/payload-types'

export const Header = ({
  phone,
  categories,
}: {
  phone?: string | null
  categories?: Category[]
}) => {
  const router = useRouter()
  const { cartCount } = useCart()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Only read searchParams on mount to initialize searchValue
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const q = params.get('q') || ''
      setSearchValue(q)
    }
  }, [])

  // Prevent scroll when menu or cart is open
  useEffect(() => {
    if (isMenuOpen || isCartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen, isCartOpen])

  const handleSearchToggle = () => {
    setIsSearchOpen(true)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }

  const handleSearchBlur = () => {
    if (!searchValue.trim()) {
      setIsSearchOpen(false)
    }
  }

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (searchValue.trim()) {
      router.push(`/product?q=${encodeURIComponent(searchValue.trim())}`)
    } else {
      router.push('/product')
    }
    setIsSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo Section & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Mobile Menu Toggle - Moved to Left */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-foreground hover:text-foreground/80"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link href="/" className="flex items-center gap-2">
              <Logo imgSize='w-10 h-10' textSize='text-3xl' />
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full flex">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search your desired product"
                className="w-full px-4 py-2 border border-r-0 border-input rounded-l-md focus:outline-none focus:border-primary bg-background text-foreground"
              />
              <button
                type="submit"
                className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-r-md transition-all"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Phone - Mobile Only */}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="md:hidden text-muted-foreground hover:text-foreground"
              >
                <Phone className="w-6 h-6" />
              </a>
            )}

            {/* Mobile Search Toggle */}
            <button
              onClick={handleSearchToggle}
              className="md:hidden text-foreground hover:text-foreground/80"
              aria-label="Search"
            >
              <Search className="w-6 h-6" />
            </button>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="text-foreground hover:text-foreground/80 relative"
              aria-label="Open cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Row - Visible only on mobile */}
        {isSearchOpen && (
          <div className="mt-3 md:hidden">
            <form onSubmit={handleSearchSubmit} className="relative w-full flex">
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onBlur={handleSearchBlur}
                placeholder="Search your desired product"
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:border-primary bg-background text-foreground"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-3 text-muted-foreground"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Category Menu - Side Drawer */}
        <MobileMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          categories={categories}
        />

        {/* Cart Drawer - Side Drawer (Right) */}
        <div className="max-w-screen overflow-hidden">
          <CartDrawer isOpen={isCartOpen} setIsOpen={setIsCartOpen} />
        </div>
      </div>
    </header>
  )
}
