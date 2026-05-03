import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { CategorySidebar, CategoryMobileNav } from '@/components/CategorySelection'
import { ProductCard } from '@/components/ProductCard'
import { ProductSort } from '@/components/ProductSort'
import { Pagination } from '@/components/Pagination'
import { ProductFilters } from '@/components/ProductFilters'

export const revalidate = 60 // Revalidate this page every 60 seconds

interface PageProps {
  searchParams: Promise<{
    category?: string
    sort?: string
    page?: string
    min_price?: string
    max_price?: string
    in_stock?: string
    q?: string
  }>
}

export default async function ProductPage({ searchParams }: PageProps) {
  const { category, sort, page, min_price, max_price, in_stock, q } = await searchParams
  const payload = await getPayload({ config })

  const activeCategoryId = category ? parseInt(category, 10) : undefined
  const pageNum = page ? parseInt(page, 10) : 1
  const limit = 30

  // Fetch categories
  const categoriesResult = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'name',
  })
  const categories = categoriesResult.docs

  // Build query for products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const andConditions: any[] = []

  if (activeCategoryId) {
    andConditions.push({
      category: {
        equals: activeCategoryId,
      },
    })
  }

  if (min_price) {
    const min = parseInt(min_price, 10)
    if (!isNaN(min)) {
      andConditions.push({
        price: {
          greater_than_equal: min,
        },
      })
    }
  }

  if (max_price) {
    const max = parseInt(max_price, 10)
    if (!isNaN(max)) {
      andConditions.push({
        price: {
          less_than_equal: max,
        },
      })
    }
  }

  // "In Stock" means stock_status is FALSE (unchecked)
  if (in_stock === 'true') {
    andConditions.push({
      stock_status: {
        equals: false,
      },
    })
  }

  if (q) {
    andConditions.push({
      or: [
        {
          name: {
            contains: q,
          },
        },
        // Description is rich text, searching it is harder with simple contains usually
        // but let's try if it works or just search name for now to be safe/fast
      ],
    })
  }

  if (andConditions.length > 0) {
    where.and = andConditions
  }

  // Determine sort order
  let sortQuery = '-createdAt' // Default to newest
  if (sort === 'price_asc') sortQuery = 'price'
  if (sort === 'price_desc') sortQuery = '-price'

  // Fetch products
  const productsResult = await payload.find({
    collection: 'products',
    where,
    sort: sortQuery,
    limit,
    page: pageNum,
    depth: 1, // Ensure we get media objects
  })
  const products = productsResult.docs
  const totalPages = productsResult.totalPages

  return (
    <div className="container mx-auto px-4 pt-4 pb-12">
      {/* <h1 className="text-3xl font-bold mb-8">All Products</h1> */}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-64 shrink-0 space-y-8">
          <CategorySidebar categories={categories} activeCategoryId={activeCategoryId} />
          <div className="bg-card border border-border rounded-lg p-4">
            <ProductFilters />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1" id="products">
          {/* Mobile Categories & Filters */}
          <div className="md:hidden mb-6 space-y-4">
            <CategoryMobileNav categories={categories} activeCategoryId={activeCategoryId} />
            <details className="bg-card border border-border rounded-lg p-4">
              <summary className="font-medium cursor-pointer">Filters</summary>
              <div className="mt-4">
                <ProductFilters />
              </div>
            </details>
          </div>

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">Showing {products.length} products</p>
            <ProductSort />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.length === 0 ? (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                No products found matching your criteria.
              </div>
            ) : (
              products.map((product) => {
                let imageUrl = `https://placehold.co/400x400/222/white?text=${encodeURIComponent(product.name.substring(0, 2))}`

                if (product.images && product.images.length > 0) {
                  const firstVal = product.images[0].image
                  if (
                    firstVal &&
                    typeof firstVal === 'object' &&
                    'url' in firstVal &&
                    firstVal.url
                  ) {
                    imageUrl = firstVal.url
                  }
                }

                const discountAmount =
                  product.price_before && product.price
                    ? product.price_before - product.price
                    : undefined

                return (
                  <ProductCard
                    key={product.slug}
                    id={product.id}
                    slug={product.slug}
                    title={product.name}
                    price={product.price}
                    oldPrice={product.price_before || undefined}
                    discountAmount={discountAmount}
                    image={imageUrl}
                  />
                )
              })
            )}
          </div>

          {/* Pagination */}
          <div className="mt-8">
            <Pagination totalPages={totalPages} />
          </div>
        </div>
      </div>
    </div>
  )
}
