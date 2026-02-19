'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Product, Media } from '@/payload-types'
import {
  ShoppingBag,
  ShoppingCart,
  Minus,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RichTextParser } from './RichTextParser'
import { useCart } from './CartContext'
import { useRouter } from 'next/navigation'

interface ProductDetailsProps {
  product: Product
}

export const ProductDetails = ({ product }: ProductDetailsProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const productImages = product.images || []
  // Filter for valid images only (where image is populated and valid)
  // We keep the container object to access the 'color' field
  const validImages = productImages.filter((item) => item.image && typeof item.image !== 'number')

  const displayImages = validImages.map((item) => item.image as Media)
  const currentImage = displayImages[selectedImageIndex]

  // Derive unique colors from images
  const availableColors = Array.from(
    new Set(validImages.map((img) => img.color).filter((color): color is string => !!color)),
  )

  const [selectedColor, setSelectedColor] = useState<string | null>(
    availableColors.length > 0 ? availableColors[0] : null,
  )

  const [isAdded, setIsAdded] = useState(false)
  const { addItem } = useCart()
  const router = useRouter()

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      title: product.name,
      price: product.price,
      image: currentImage?.url || undefined,
      quantity: quantity,
      color: selectedColor || undefined,
    })
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleCreateOrder = () => {
    handleAddToCart()
    router.push('/checkout')
  }

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    const index = validImages.findIndex((img) => img.color === color)
    if (index !== -1) {
      setSelectedImageIndex(index)
    }
  }

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))
  }

  const discount = product.price_before
    ? Math.round(((product.price_before - product.price) / product.price_before) * 100)
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      {/* Image Gallery */}
      <div className="flex flex-col gap-4">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted border border-border group">
          {currentImage?.url && (
            <Image
              src={currentImage.url}
              alt={currentImage.alt || product.name}
              fill
              className="object-cover"
              priority
            />
          )}
          {discount > 0 && (
            <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-sm font-bold rounded-full z-10">
              -{discount}%
            </div>
          )}

          {displayImages.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow-md z-10 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow-md z-10 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {displayImages.length > 1 && (
          <div className="grid grid-cols-5 gap-3">
            {displayImages.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-lg border-2 transition-all',
                  selectedImageIndex === idx
                    ? 'border-black ring-1 ring-black/10'
                    : 'border-transparent hover:border-gray-200',
                )}
              >
                {img.url && (
                  <Image
                    src={img.url}
                    alt={img.alt || product.name}
                    fill
                    className="object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <h1 className="text-3xl font-medium text-foreground tracking-tight mb-2">
            {product.name}
          </h1>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-2xl font-semibold text-foreground">
              Tk {product.price.toLocaleString()}.00
            </span>
            {product.price_before && (
              <span className="text-lg text-muted-foreground line-through decoration-slate-400">
                Tk {product.price_before.toLocaleString()}
              </span>
            )}
            {product.stock_status && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Colors */}
        {availableColors.length > 0 && (
          <div className="mb-6">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Color: <span className="text-foreground">{selectedColor}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={cn(
                    'px-4 py-2 border rounded-md text-sm font-medium transition-all',
                    selectedColor === color
                      ? 'border-black bg-black text-white hover:bg-gray-800'
                      : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity and Actions */}
        <div className="flex flex-col gap-4 mb-8 pb-8 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-input rounded-md max-w-35">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-accent text-muted-foreground transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center font-medium w-8">{quantity}</div>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-3 hover:bg-accent text-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-muted-foreground">
              {product.stock_status ? 'Currently Unavailable' : 'In Stock'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!!product.stock_status || isAdded}
              className={cn(
                'flex items-center justify-center gap-2 border px-6 py-3.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                isAdded
                  ? 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                  : 'border-black text-black bg-white hover:bg-gray-50',
              )}
            >
              {isAdded ? (
                <>
                  <Check className="w-5 h-5" />
                  Added
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </>
              )}
            </button>
            <button
              onClick={handleCreateOrder}
              disabled={!!product.stock_status}
              className="flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 px-6 py-3.5 rounded-lg font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              <ShoppingBag className="w-5 h-5" />
              Buy Now
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="prose-container">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Description</h2>
          <RichTextParser content={product.description} />
        </div>
      </div>
    </div>
  )
}
