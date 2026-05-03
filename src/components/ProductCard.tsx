'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useCart } from './CartContext'
import { motion } from 'framer-motion'

interface ProductCardProps {
  id: string
  slug: string
  title: string
  price: number
  oldPrice?: number
  image: string
  discountAmount?: number
  currency?: string
}

export const ProductCard = ({
  title,
  id,
  slug,
  price,
  oldPrice,
  image,
  discountAmount,
  currency = 'Tk',
}: ProductCardProps) => {
  const { addItem } = useCart()
  const [isAdded, setIsAdded] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation to product page
    e.stopPropagation()

    addItem({
      id,
      title,
      price,
      image,
    })

    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  return (
    <Link href={'/product/' + slug}>
      <motion.div 
        whileHover={{ y: -5 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="group bg-card rounded-lg p-3 hover:shadow-xl hover:shadow-primary/10 transition-all border border-border flex flex-col h-full"
      >
        {/* Image Container */}
        <div className="relative aspect-square mb-3 overflow-hidden rounded-md bg-muted">
          {discountAmount && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-sm z-10">
              সাশ্রয় {discountAmount} BDT
            </div>
          )}
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col grow">
          <div className="flex items-baseline gap-2 mb-1 justify-center">
            {oldPrice && (
              <span className="text-muted-foreground text-sm line-through decoration-muted-foreground">
                {currency} {oldPrice}
              </span>
            )}
            <span className="font-bold text-lg text-foreground">
              {currency} {price}
            </span>
          </div>

          <h3 className="text-muted-foreground text-sm text-center mb-4 line-clamp-2 min-h-[2.5em]">
            {title}
          </h3>

          <div className="mt-auto">
            <button
              onClick={handleAddToCart}
              disabled={isAdded}
              className={cn(
                'w-full border font-medium py-2 rounded-md flex items-center justify-center gap-2 transition-colors text-sm',
                isAdded
                  ? 'bg-green-700 border-green-700 text-white'
                  : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground',
              )}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  যুক্ত হয়েছে
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  কার্টে যোগ করুন
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
