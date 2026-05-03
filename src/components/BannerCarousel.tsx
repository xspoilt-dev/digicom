'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Media } from '@/payload-types'

interface Banner {
  id?: string | null
  image?: string | number | Media
  link?: string | null
}

interface BannerCarouselProps {
  banners: Banner[]
  interval?: number
}

const BannerCarousel = ({ banners, interval = 5000 }: BannerCarouselProps) => {
  const [current, setCurrent] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Filter out invalid banners
  const validBanners = banners.filter((b) => b.image && typeof b.image === 'object' && b.image.url)

  useEffect(() => {
    if (validBanners.length <= 1 || isHovered) return

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % validBanners.length)
    }, interval)

    return () => clearInterval(timer)
  }, [validBanners.length, isHovered, interval])

  if (validBanners.length === 0) return null

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + validBanners.length) % validBanners.length)
  }

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % validBanners.length)
  }

  return (
    <div
      className="group relative w-full overflow-hidden rounded-xl bg-muted aspect-3/2 sm:aspect-21/9 md:aspect-3/1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {validBanners.map((banner, index) => {
          const media = banner.image as Media
          const imageUrl = media.url || ''
          const link = banner.link

          const Content = (
            <div className="relative w-full h-full shrink-0">
              <Image
                src={imageUrl}
                alt={media.alt || 'Banner image'}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          )

          return (
            <div key={index} className="w-full h-full shrink-0 relative">
              {link ? (
                <Link href={link} className="block w-full h-full">
                  {Content}
                </Link>
              ) : (
                Content
              )}
            </div>
          )
        })}
      </div>

      {/* Controls */}
      {validBanners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault()
              prevSlide()
            }}
            className="absolute z-10 left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/50 hover:bg-background/80 text-foreground transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              nextSlide()
            }}
            className="absolute z-10 right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/50 hover:bg-background/80 text-foreground transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {validBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  current === idx
                    ? 'bg-primary-foreground w-4'
                    : 'bg-primary/50 hover:bg-primary/75',
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default BannerCarousel
