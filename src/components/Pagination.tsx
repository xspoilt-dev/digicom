'use client'

import React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  totalPages: number
}

export const Pagination = ({ totalPages }: PaginationProps) => {
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', pageNumber.toString())
    return `/?${params.toString()}`
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      {/* Previous Button */}
      <Link
        href={createPageUrl(currentPage - 1)}
        className={cn(
          'p-2 rounded-md border border-input bg-card text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
          currentPage <= 1 && 'pointer-events-none opacity-50',
        )}
        aria-disabled={currentPage <= 1}
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="sr-only">Previous Page</span>
      </Link>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {[...Array(totalPages)].map((_, i) => {
          const pageStr = i + 1

          // Simple logic: Show all if few pages, or ellipsis if many.
          // For now, let's keep it simple and show limited range if necessary,
          // but "simple" implementation usually just maps all or does a window.
          // Given the prompt "simple e-commerce", maybe show all or max 5?
          // Let's implement a simple window: First, Last, and neighbors of current.

          const isNearCurrent = Math.abs(pageStr - currentPage) <= 1
          const isFirstOrLast = pageStr === 1 || pageStr === totalPages

          if (!isNearCurrent && !isFirstOrLast && totalPages > 7) {
            // Show ellipsis locally?
            // To make it simpler for this task, I'll filter the list of numbers to render.
            return null
          }

          // Re-implementing rendering logic below cleanly
          return null
        })}

        {(() => {
          const pages = []
          for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
              pages.push(i)
            }
          }

          // Add ellipses
          const pagesWithEllipsis: (number | string)[] = []
          let prev = 0
          for (const p of pages) {
            if (prev > 0 && p - prev > 1) {
              pagesWithEllipsis.push('...')
            }
            pagesWithEllipsis.push(p)
            prev = p
          }

          return pagesWithEllipsis.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              )
            }

            const p = page as number
            const isActive = p === currentPage

            return (
              <Link
                key={p}
                href={createPageUrl(p)}
                className={cn(
                  'min-w-10 h-10 flex items-center justify-center rounded-md border text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-input hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {p}
              </Link>
            )
          })
        })()}
      </div>

      {/* Next Button */}
      <Link
        href={createPageUrl(currentPage + 1)}
        className={cn(
          'p-2 rounded-md border border-input bg-card text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
          currentPage >= totalPages && 'pointer-events-none opacity-50',
        )}
        aria-disabled={currentPage >= totalPages}
      >
        <ChevronRight className="w-5 h-5" />
        <span className="sr-only">Next Page</span>
      </Link>
    </div>
  )
}
