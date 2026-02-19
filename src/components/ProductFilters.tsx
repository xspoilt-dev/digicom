'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export function ProductFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '')
  const [inStock, setInStock] = useState(searchParams.get('in_stock') === 'true')

  // Effect to update local state when URL params change (e.g. clear filters)
  useEffect(() => {
    setMinPrice(searchParams.get('min_price') || '')
    setMaxPrice(searchParams.get('max_price') || '')
    setInStock(searchParams.get('in_stock') === 'true')
  }, [searchParams])

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (minPrice) params.set('min_price', minPrice)
    else params.delete('min_price')

    if (maxPrice) params.set('max_price', maxPrice)
    else params.delete('max_price')

    if (inStock) params.set('in_stock', 'true')
    else params.delete('in_stock')

    // Reset page when filtering
    params.delete('page')

    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('min_price')
    params.delete('max_price')
    params.delete('in_stock')
    params.delete('page')

    setMinPrice('')
    setMaxPrice('')
    setInStock(false)

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Price</h3>
        <div className="flex items-center gap-2">
          <div className="grid w-full items-center gap-1.5">
            <label
              htmlFor="min-price"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Min
            </label>
            <input
              type="number"
              id="min-price"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <label
              htmlFor="max-price"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Max
            </label>
            <input
              type="number"
              id="max-price"
              placeholder="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Availability</h3>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="in-stock"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label
            htmlFor="in-stock"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            In Stock Only
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={applyFilters}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
        >
          Apply Filters
        </button>
        <button
          onClick={clearFilters}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
        >
          Clear Filters
        </button>
      </div>
    </div>
  )
}
