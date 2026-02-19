'use client'

import { useField } from '@payloadcms/ui'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Product, Media } from '@/payload-types'

type Props = {
  path: string
}

export default function OrderProductField({ path }: Props) {
  const { value } = useField<number>({ path })
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (value && typeof value === 'number') {
      setIsLoading(true)
      // fetch product with depth 1 to get image url
      fetch(`/api/products/${value}?depth=1`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch')
          return res.json()
        })
        .then((data: Product) => {
          setProduct(data)
          setIsLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setIsLoading(false)
        })
    }
  }, [value])

  if (!value) return <div style={{ color: '#999', fontSize: '0.875rem' }}>No product selected</div>
  if (isLoading)
    return (
      <div
        style={
          {
            height: '4rem',
            background: '#f3f4f6',
            borderRadius: '6px',
            width: '100%',
            animate: 'pulse',
          } as any
        }
      />
    )

  if (!product) return <div style={{ color: 'red' }}>Product not found</div>

  const imageObj = product.images?.[0]?.image
  let imageUrl: string | null = null

  if (imageObj && typeof imageObj !== 'number') {
    imageUrl = imageObj.thumbnailURL || imageObj.url || null
  }

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        backgroundColor: '#fff',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '6px',
          overflow: 'hidden',
          backgroundColor: '#f9fafb',
          border: '1px solid #f3f4f6',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontSize: '10px', color: '#9ca3af' }}>No Img</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>
          {product.name}
        </span>
        <Link
          href={`/admin/collections/products/${product.id}`}
          target="_blank"
          style={{ fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none' }}
          onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          View Product &rarr;
        </Link>
      </div>
    </div>
  )
}
