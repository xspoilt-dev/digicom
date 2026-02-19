import dotenv from 'dotenv'
import { getPayload } from 'payload'
import { parseArgs, log, deleteAllDocs } from './seed/utils'
import { seedUsers } from './seed/users'
import { seedCategories, seedProducts } from './seed/product'
import { seedOrders } from './seed/orders'
import { ApiCategory, ApiProduct, SeedPayload } from './seed/types'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

async function seed() {
  const args = parseArgs(process.argv.slice(2))

  if (args.envFile) {
    dotenv.config({ path: args.envFile })
  } else {
    dotenv.config()
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL (set it in .env)')
  }
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('Missing PAYLOAD_SECRET (set it in .env)')
  }

  const { default: config } = await import('../payload.config')
  const payload = (await getPayload({ config })) as unknown as SeedPayload

  log(args.silent, 'Seeding Payload content…')

  log(args.silent, `Seed options: ${JSON.stringify(args)}`)

  if (args.reset) {
    if (!args.confirm) {
      throw new Error(
        'Refusing to reset without --confirm (this deletes ALL docs in seeded collections).',
      )
    }

    log(args.silent, 'Resetting all seeded collections...')
    await deleteAllDocs(payload, 'orders', args.silent)
    await deleteAllDocs(payload, 'products', args.silent)
    await deleteAllDocs(payload, 'categories', args.silent)
    await deleteAllDocs(payload, 'media', args.silent)
    await deleteAllDocs(payload, 'users', args.silent)

    log(args.silent, 'Reset complete.')
  }

  // Fetch API Data
  log(args.silent, 'Fetching demo data from api.escuelajs.co...')
  let apiCategories: ApiCategory[] = []
  let apiProducts: ApiProduct[] = []

  try {
    const [catRes, prodRes] = await Promise.all([
      fetch('https://api.escuelajs.co/api/v1/categories'),
      fetch('https://api.escuelajs.co/api/v1/products'),
    ])

    if (catRes.ok) apiCategories = (await catRes.json()) as ApiCategory[]
    if (prodRes.ok) apiProducts = (await prodRes.json()) as ApiProduct[]
    log(args.silent, `Fetched categories: ${apiCategories.map((c) => c.name).join(', ')}`)
    log(args.silent, `Fetched products: ${apiProducts.length}`)
  } catch (e) {
    console.error('Failed to fetch API data:', e)
    throw new Error('Failed to fetch initial seed data')
  }

  log(args.silent, `Fetched ${apiCategories.length} categories and ${apiProducts.length} products.`)

  // --- Users ---
  const { staffId, customerId } = await seedUsers(payload, args)

  // --- Categories ---
  const categoryIdMap = await seedCategories(payload, args, apiCategories)

  // --- Products ---
  const seededProductIds = await seedProducts(payload, args, apiProducts, categoryIdMap)

  // --- Orders ---
  await seedOrders(payload, args, seededProductIds, customerId)

  log(args.silent, 'Seed complete.')
  log(args.silent, 'Demo credentials:')
  log(args.silent, '  admin@demo.local / demo12345')
  log(args.silent, '  customer@demo.local / demo12345')
}

await seed().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
