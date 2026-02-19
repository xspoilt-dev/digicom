import { SeedPayload, ID, SeedArgs } from './types'
import { findFirstId, toID, log } from './utils'

export async function createUserIfMissing(
  payload: SeedPayload,
  data: {
    email: string
    password: string
    roles: ('admin' | 'customer')[]
  },
) {
  const existingId = await findFirstId(payload, 'users', { email: { equals: data.email } })
  if (existingId) {
    await payload.update({
      collection: 'users',
      id: existingId,
      data: {
        roles: data.roles,
      },
    })
    return existingId
  }

  const doc = await payload.create({
    collection: 'users',
    data,
  })

  return toID(doc.id)
}

export async function seedUsers(payload: SeedPayload, args: SeedArgs) {
  log(args.silent, 'Seeding users...')

  const adminId = await createUserIfMissing(payload, {
    email: 'admin@demo.local',
    password: 'demo12345',
    roles: ['admin'],
  })
  log(args.silent, `Admin user ID: ${adminId}`)

  // Mapping "staff" to admin
  const staffId = await createUserIfMissing(payload, {
    email: 'staff@demo.local',
    password: 'demo12345',
    roles: ['admin'],
  })
  log(args.silent, `Staff (Admin) user ID: ${staffId}`)

  const customerId = await createUserIfMissing(payload, {
    email: 'customer@demo.local',
    password: 'demo12345',
    roles: ['customer'],
  })
  log(args.silent, `Customer user ID: ${customerId}`)

  log(args.silent, `Users: admin=${adminId}, staff=${staffId}, customer=${customerId}`)

  return { adminId, staffId, customerId }
}
