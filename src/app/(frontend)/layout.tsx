import React from 'react'
import './styles.css'
import { getPayload } from 'payload'
import config from '@/payload.config'
import NextTopLoader from 'nextjs-toploader'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CartProvider } from '@/components/CartContext'
import CallButton from '@/components/CallButton'

export const metadata = {
  description:
    'Helloman is your go-to online store for high-quality products that combine functionality and style. Explore our diverse range of items designed to meet your everyday needs.',
  title: 'Helloman',
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

  return (
    <html lang="en">
      <head>
        <link rel="icon" sizes="512x512" href="/icon.png" />
        <link rel="icon" sizes="192x192" href="/icon192.png" />
        <link rel="icon" sizes="144x144" href="/icon144.png" />
      </head>
      <body className="bg-background min-h-screen max-w-screen overflow-x-hidden text-foreground font-sans antialiased flex flex-col">
        <NextTopLoader color="#71717a" />
        <CartProvider>
          <Header phone={phone} categories={categories} />
          <main className="flex-1">{children}</main>
          <Footer />
          <CallButton />
        </CartProvider>
      </body>
    </html>
  )
}
