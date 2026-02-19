import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Category } from '@/payload-types'

interface CategorySelectionProps {
  categories: Category[]
  activeCategoryId?: number | null
}

export const CategorySidebar = ({ categories, activeCategoryId }: CategorySelectionProps) => {
  return (
    <div className="w-full bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/50">
        <h2 className="font-bold text-card-foreground">Categories</h2>
      </div>
      <div className="flex flex-col">
        {/* All Categories Option */}
        <Link
          href="/product"
          className={cn(
            'text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted transition-colors text-sm font-medium',
            !activeCategoryId
              ? 'bg-muted font-bold border-l-4 border-l-primary'
              : 'text-muted-foreground border-l-4 border-l-transparent hover:border-l-border',
          )}
        >
          All Products
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/product?category=${cat.id}`}
            className={cn(
              'text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted transition-colors text-sm font-medium',
              activeCategoryId === cat.id
                ? 'bg-muted font-bold border-l-4 border-l-primary'
                : 'text-muted-foreground border-l-4 border-l-transparent hover:border-l-border',
            )}
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </div>
  )
}

export const CategoryMobileNav = ({ categories, activeCategoryId }: CategorySelectionProps) => {
  return (
    <div className="flex overflow-x-auto pb-2 gap-2 md:hidden no-scrollbar">
      <Link
        href="/product"
        className={cn(
          'whitespace-nowrap px-4 py-2 rounded-full border text-sm font-medium',
          !activeCategoryId
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card text-muted-foreground border-border',
        )}
      >
        All Products
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/product?category=${cat.id}`}
          className={cn(
            'whitespace-nowrap px-4 py-2 rounded-full border text-sm font-medium',
            activeCategoryId === cat.id
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border',
          )}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  )
}
