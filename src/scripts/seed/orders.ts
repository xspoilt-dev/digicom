import { SeedPayload, ID, SeedArgs } from './types'
import { log, toID } from './utils'

export async function seedOrders(
  payload: SeedPayload,
  args: SeedArgs,
  productIds: ID[],
  customerId: ID,
) {
  log(args.silent, 'Seeding orders...')

  if (productIds.length == 0) {
    log(args.silent, 'No products available to seed orders.')
    return
  }

  // Create a few orders for the customer
  const numOrders = 5

  for (let i = 0; i < numOrders; i++) {
    // Pick 1-3 random products per order
    const numItems = 1 + Math.floor(Math.random() * 3)
    const items = []
    let total = 0

    for (let j = 0; j < numItems; j++) {
      const pId = productIds[Math.floor(Math.random() * productIds.length)] as number
      // Fetch product to get price (simulated, ideally we should read it but for speed we assume we recall or re-fetch)
      const product = await payload.findByID({ collection: 'products', id: pId })
      if (!product) continue

      const quantity = 1 + Math.floor(Math.random() * 2)
      const price = typeof product.price === 'number' ? product.price : 0

      items.push({
        product: pId,
        quantity,
        price,
        color: 'Black', // Dummy color
      })
      total += price * quantity
    }

    if (items.length === 0) continue

    await payload.create({
      collection: 'orders',
      data: {
        status: 'pending',
        customer: {
          fullname: 'Demo Customer',
          phone: '+1234567890',
          email: 'customer@demo.local',
          address: '123 Seed Street',
        },
        items,
        total,
        paymentMethod: 'cash_on_delivery',
        note: `Seeded Order #${i + 1}`,
      },
    })

    log(args.silent, `Order ${i + 1} created with total ${total}`)
  }

  log(args.silent, `Orders seeded: ${numOrders}`)
}
