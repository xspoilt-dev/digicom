'use client'

import Link from 'next/link'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { Category } from '@/payload-types'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  categories?: Category[]
}

export const MobileMenu = ({ isOpen, onClose, categories }: MobileMenuProps) => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-background/20 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-screen w-[85vw] max-w-xs bg-background p-6 shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <span className="text-xl font-bold text-foreground">Menu</span>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <nav className="flex flex-col">
          {/* Home */}
          <Link
            href="/"
            className="block text-lg font-medium text-foreground hover:text-primary transition-colors border-b border-muted py-3"
            onClick={onClose}
          >
            Home
          </Link>

          {/* Categories */}
          <div className="border-b border-muted">
            <button
              onClick={() => setIsCategoriesOpen((prev) => !prev)}
              className="flex items-center justify-between w-full text-lg font-medium text-foreground hover:text-primary transition-colors py-3"
            >
              Categories
              {isCategoriesOpen ? (
                <ChevronUp className="h-5 w-5 shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0" />
              )}
            </button>

            {isCategoriesOpen && (
              <div className="flex flex-col pb-2 pl-4">
                <Link
                  href="/product"
                  className="block text-base text-muted-foreground hover:text-primary transition-colors py-2 border-b border-muted/60 last:border-b-0"
                  onClick={onClose}
                >
                  All Products
                </Link>
                {categories?.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/product?category=${cat.id}`}
                    className="block text-base text-muted-foreground hover:text-primary transition-colors py-2 border-b border-muted/60 last:border-b-0"
                    onClick={onClose}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </>
  )
}
