'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Category, Media } from '@/payload-types'

interface CategoryCarouselProps {
  categories: Category[]
}

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = React.useState(false)
  const [showRightArrow, setShowRightArrow] = React.useState(true)

  const checkScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10) // buffer
  }

  React.useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const scrollAmount = container.clientWidth / 2
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  if (!categories || categories.length === 0) return null

  return (
    <div className="relative group w-full py-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="text-xl font-bold tracking-tight">Shop by Category</h2>
        <Link
          href="/product"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 shadow-md border border-border hover:bg-background transition-all -ml-4 md:-ml-6"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => {
            const media = category.image as Media
            const imageUrl = media?.url

            return (
              <Link
                key={category.id}
                href={`/product?category=${category.id}`}
                className="flex flex-col items-center gap-2 group/card min-w-[100px] sm:min-w-[120px] snap-start"
              >
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-border bg-muted transition-transform duration-300 group-hover/card:scale-105 group-hover/card:border-primary/50">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={category.name} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground text-xs p-2 text-center">
                      {category.name}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-center group-hover/card:text-primary transition-colors line-clamp-2 max-w-[120px]">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 shadow-md border border-border hover:bg-background transition-all -mr-4 md:-mr-6"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
