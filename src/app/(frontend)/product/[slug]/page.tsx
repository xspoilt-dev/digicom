import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { ProductDetails } from '@/components/ProductDetails'
import { ProductCard } from '@/components/ProductCard'
import { Product, Media } from '@/payload-types'

export const revalidate = 60 // Revalidate this page every hour

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  if (!slug) return notFound()

  let product: Product | null = null

  try {
    const { docs } = await payload.find({
      collection: 'products',
      where: {
        slug: {
          equals: slug,
        },
      },
      depth: 2,
      limit: 1,
    })
    product = docs[0] || null
  } catch (_) {
    return notFound()
  }

  if (!product) return notFound()

  // Fetch related products
  let relatedProducts: Product[] = []
  const limit = 16

  // Step 1: Fetch by price range
  if (product.price) {
    const minPrice = Math.floor(product.price * 0.8)
    const maxPrice = Math.ceil(product.price * 1.2)

    const { docs } = await payload.find({
      collection: 'products',
      where: {
        and: [
          {
            price: {
              greater_than_equal: minPrice,
            },
          },
          {
            price: {
              less_than_equal: maxPrice,
            },
          },
          {
            slug: {
              not_equals: product.slug,
            },
          },
        ],
      },
      limit,
      depth: 1,
    })
    relatedProducts = docs
  }

  // Step 2: Fill remaining slots if necessary
  if (relatedProducts.length < limit) {
    const remaining = limit - relatedProducts.length
    const excludeSlugs = [product.slug, ...relatedProducts.map((p) => p.slug)]

    const fallbackWhere: any = {
      slug: {
        not_in: excludeSlugs,
      },
    }

    if (product.category) {
      const categoryId =
        typeof product.category === 'object' ? product.category.id : product.category
      fallbackWhere.category = {
        equals: categoryId,
      }
    }

    const { docs: fallbackDocs } = await payload.find({
      collection: 'products',
      where: fallbackWhere,
      limit: remaining,
      depth: 1,
      sort: '-createdAt', // Fallback to newest if price match fails
    })

    relatedProducts = [...relatedProducts, ...fallbackDocs]
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <ProductDetails product={product} />

      {relatedProducts.length > 0 && (
        <div className="mt-24 border-t pt-16">
          <h3 className="text-2xl font-bold mb-8">Related Products</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => {
              const img = p.images?.[0]?.image as Media
              return (
                <ProductCard
                  key={p.slug}
                  id={p.id}
                  slug={p.slug}
                  title={p.name}
                  price={p.price}
                  oldPrice={p.price_before || undefined}
                  image={img?.url || ''}
                  discountAmount={p.price_before ? p.price_before - p.price : undefined}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  try {
    const { docs } = await payload.find({
      collection: 'products',
      where: {
        slug: {
          equals: slug,
        },
      },
      limit: 1,
    })
    const product = docs[0]
    if (!product) return { title: 'Product Not Found' }
    return {
      title: `${product.name} | Facevaly`,
      description: `Buy ${product.name} at Facevaly. Explore features, pricing, and reviews for this high-quality product. Shop now and enjoy great deals!`,
    }
  } catch (_) {
    return {
      title: 'Product Not Found | Facevaly',
    }
  }
}
