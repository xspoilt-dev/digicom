import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import BannerCarousel from '@/components/BannerCarousel'
import { CategoryCarousel } from '@/components/CategoryCarousel'
import Link from 'next/link'
import type { Media } from '@/payload-types'
import { ProductCard } from '@/components/ProductCard'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export const revalidate = 60

export default async function HomePage() {
  const payload = await getPayload({ config })

  const pageEditor = await payload.findGlobal({
    slug: 'page-editor',
    depth: 1,
  })

  // Fetch categories
  const categoriesResult = await payload.find({
    collection: 'categories',
    limit: 20,
    sort: 'name',
    depth: 1,
  })

  const homePage = pageEditor.homePage
  const heroImages = homePage?.heroImages || []
  const bannerImages = homePage?.bannerImages || []
  const numberOfProducts = homePage?.numberOfProducts || 10

  // Fetch products
  const productsResult = await payload.find({
    collection: 'products',
    limit: numberOfProducts,
    depth: 1,
    sort: '-createdAt',
  })

  // Format hero images for BannerCarousel
  const heroBanners = heroImages.map((hero) => ({
    id: hero.id,
    image: hero.image,
    link: hero.link,
  }))

  return (
    <div className="container mx-auto px-4 md:px-6 pt-2 md:pt-4 pb-12">
      {/* Hero Banner */}
      {heroBanners.length > 0 && (
        <div className="mb-4 md:mb-8 -mx-4 md:mx-0">
          <BannerCarousel banners={heroBanners} />
        </div>
      )}

      {/* Category Carousel */}
      {categoriesResult.docs.length > 0 && (
        <div className="mb-6 md:mb-10">
          <CategoryCarousel categories={categoriesResult.docs} />
        </div>
      )}

      {/* Banner Images Grid */}
      {bannerImages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 md:mb-12">
          {bannerImages.map((banner, index) => {
            const media = banner.image as Media
            const imageUrl = media?.url
            if (!imageUrl) return null

            const Content = (
              <div className="relative aspect-video rounded-lg overflow-hidden group">
                <Image
                  src={imageUrl}
                  alt={media.alt || 'Banner image'}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )

            return (
              <div key={banner.id || index}>
                {banner.link ? (
                  <Link href={banner.link} className="block h-full w-full">
                    {Content}
                  </Link>
                ) : (
                  Content
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Featured Products */}
      <div className="py-4 md:py-8">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xl font-bold tracking-tight">পণ্যসমূহ</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productsResult.docs.map((product) => {
            const firstImage = product.images?.[0]?.image as Media
            const imageUrl = firstImage?.url || ''

            return (
              <ProductCard
                key={product.slug}
                id={product.id}
                slug={product.slug}
                title={product.name}
                price={product.price}
                oldPrice={product.price_before ?? undefined}
                image={imageUrl}
                discountAmount={
                  product.price_before ? product.price_before - product.price : undefined
                }
              />
            )
          })}
        </div>
        <div className='flex justify-center mt-6 md:mt-8'>
          <Link
            href="/product"
            className=" inline-flex items-center text-lg md:text-xl hover:scale-105 transition-all duration-200 font-semibold text-primary bg-primary/10 px-6 py-2 rounded-full"
          >
            সকল পণ্য দেখুন
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  )
}