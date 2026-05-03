import React from 'react'
import './styles.css'
import { getPayload } from 'payload'
import config from '@/payload.config'
import NextTopLoader from 'nextjs-toploader'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CartProvider } from '@/components/CartContext'
import CallButton from '@/components/CallButton'
import { FakePurchasePopup } from '@/components/FakePurchasePopup'
import { Hind_Siliguri } from 'next/font/google'

const hindSiliguri = Hind_Siliguri({ 
  subsets: ['bengali', 'latin'], 
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
})

export const metadata = {
  description:
    'DigiCom is your go-to online store for high-quality products that combine functionality and style. Explore our diverse range of items designed to meet your everyday needs.',
  title: 'DigiCom',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({
    slug: 'site-settings',
  })
  const phone = settings?.contactInfo?.phone

  const categoriesResult = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'name',
  })
  const categories = categoriesResult.docs

  // Fetch product names for the popup
  const allProductsResult = await payload.find({
    collection: 'products',
    limit: 50,
    select: { name: true },
  })
  const productNames = allProductsResult.docs.map(p => p.name)

  return (
    <html lang="bn">
      <head>
        <link rel="icon" sizes="512x512" href="/icon.png" />
        <link rel="icon" sizes="192x192" href="/icon192.png" />
        <link rel="icon" sizes="144x144" href="/icon144.png" />
      </head>
      <body className={`${hindSiliguri.variable} font-sans bg-background min-h-screen max-w-screen overflow-x-hidden text-foreground antialiased flex flex-col`}>
        <NextTopLoader color="#71717a" />
        <CartProvider>
          <Header phone={phone} categories={categories} />
          <main className="flex-1">{children}</main>
          <Footer />
          <CallButton />
          <FakePurchasePopup productNames={productNames} />
        </CartProvider>
      </body>
    </html>
  )
}
