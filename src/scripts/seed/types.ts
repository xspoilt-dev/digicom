import type { Payload } from 'payload'

export type SeedPayload = Payload

export type ID = number | string

export interface SeedArgs {
  reset: boolean
  confirm: boolean
  noMedia: boolean
  silent: boolean
  envFile?: string
}

export type CollectionSlug = 'users' | 'media' | 'categories' | 'products' | 'orders'

export interface ApiCategory {
  id: number
  name: string
  image: string
  creationAt: string
  updatedAt: string
}

export interface ApiProduct {
  id: number
  title: string
  price: number
  description: string
  images: string[]
  creationAt: string
  updatedAt: string
  category: ApiCategory
}
