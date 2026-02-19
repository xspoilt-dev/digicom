// @ts-nocheck
import { SeedPayload, ID, SeedArgs, ApiCategory, ApiProduct } from './types'
import { findFirstId, toID, log, createRichText } from './utils'
import { createMediaFromUrl } from './media'

async function createCategoryIfMissing(
  payload: SeedPayload,
  data: {
    name: string
    image: ID
  },
) {
  const existingId = await findFirstId(payload, 'categories', { name: { equals: data.name } })
  if (existingId) {
    await payload.update({
      collection: 'categories',
      id: existingId,
      data,
    })
    return existingId
  }

  const doc = await payload.create({
    collection: 'categories',
    data,
  })

  return toID(doc.id)
}

async function createProductIfMissing(
  payload: SeedPayload,
  data: {
    name: string
    price: number
    price_before?: number
    description?: unknown
    category: ID
    images: { image: ID; color?: string }[]
    stock_status?: boolean
  },
) {
  const existingId = await findFirstId(payload, 'products', { name: { equals: data.name } })
  if (existingId) {
    await payload.update({
      collection: 'products',
      id: existingId,
      data,
    })
    return existingId
  }

  const doc = await payload.create({
    collection: 'products',
    data,
  })

  return toID(doc.id)
}

export async function seedCategories(
  payload: SeedPayload,
  args: SeedArgs,
  apiCategories: ApiCategory[],
) {
  log(args.silent, 'Seeding categories...')
  const categoryIdMap = new Map<number, ID>()

  for (const cat of apiCategories) {
    let imageId: ID | undefined
    if (!args.noMedia && cat.image) {
      const id = await createMediaFromUrl(payload, cat.image, cat.name, `cat-${cat.id}.jpg`)
      if (id) imageId = id
      log(args.silent, `Category image for '${cat.name}': ${id}`)
    }

    if (!imageId && !args.noMedia) {
      console.log(`Skipping category '${cat.name}' - failed to process image.`)
      continue
    }

    if (!imageId && args.noMedia) {
      // Mock if needed, but since it's required we will skip
      console.log(`Skipping category '${cat.name}' - image required.`)
      continue
    }

    const catId = await createCategoryIfMissing(payload, {
      name: cat.name,
      image: imageId!,
    })
    log(args.silent, `Category '${cat.name}' seeded with ID: ${catId}`)
    categoryIdMap.set(cat.id, catId)
  }
  log(args.silent, `Categories seeded: ${categoryIdMap.size}`)
  return categoryIdMap
}

export async function seedProducts(
  payload: SeedPayload,
  args: SeedArgs,
  apiProducts: ApiProduct[],
  categoryIdMap: Map<number, ID>,
) {
  log(args.silent, 'Seeding products...')
  const seededProductIds: ID[] = []

  const colors = ['Black', 'White', 'Blue', 'Gold', 'Silver']

  for (const prod of apiProducts) {
    const catId = categoryIdMap.get(prod.category.id)
    if (!catId) continue

    const productImages: { image: ID }[] = []

    // Process images
    if (!args.noMedia && prod.images && prod.images.length > 0) {
      const cleanImages = prod.images.map((img) => {
        if (img.startsWith('["') && img.endsWith('"]')) {
          try {
            return JSON.parse(img)[0]
          } catch {
            return img
          }
        }
        return img
      })

      for (let i = 0; i < Math.min(cleanImages.length, 4); i++) {
        if (!cleanImages[i]) continue
        try {
          const mId = await createMediaFromUrl(
            payload,
            cleanImages[i],
            `${prod.title} ${i + 1}`,
            `prod-${prod.id}-${i + 1}.jpg`,
          )
          if (mId) productImages.push({ image: mId })
        } catch (e) {
          // ignore
        }
      }
    }

    if (productImages.length === 0) {
      if (!args.noMedia) {
        console.log(`Skipping product '${prod.title}' - no valid images found.`)
      }
      continue
    }

    // Assign colors to images
    const pickedColors = colors
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(productImages.length, 3)) // Pick up to 3 random colors

    const imagesWithColors = productImages.map((img, idx) => ({
      ...img,
      color: pickedColors[idx % pickedColors.length], // Round robin assignment
    }))

    const prodId = await createProductIfMissing(payload, {
      name: prod.title,
      price: prod.price,
      price_before: Math.floor(prod.price * (1.2 + Math.random() * 0.3)),
      description: prod.description ? createRichText(prod.description) : undefined,
      category: catId,
      images: imagesWithColors,
      stock_status: false,
    })
    log(args.silent, `Product '${prod.title}' seeded with ID: ${prodId}`)
    seededProductIds.push(prodId)
  }
  log(args.silent, `Products seeded: ${seededProductIds.length}`)
  return seededProductIds
}
