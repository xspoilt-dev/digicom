'use client'

import React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export const ProductSort = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const sortParam = searchParams.get('sort')
  const currentSort = sortParam === 'default' || !sortParam ? 'latest' : sortParam

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    const params = new URLSearchParams(searchParams.toString())

    if (value === 'latest') {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }

    // Reset to first page when sorting changes
    params.delete('page')

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by</span>
      <select
        value={currentSort}
        onChange={handleSortChange}
        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none cursor-pointer"
        aria-label="Sort products"
      >
        <option value="latest">Latest</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
    </div>
  )
}
