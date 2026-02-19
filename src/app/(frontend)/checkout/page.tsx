import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import CheckoutClient from './CheckoutClient'

export const revalidate = false // Disable automatic revalidation

export default async function CheckoutPage() {
  const payload = await getPayload({ config })

  const siteSettings = await payload.findGlobal({
    slug: 'site-settings',
  })

  return (
    <CheckoutClient
      deliveryArgs={{
        insideDhaka: siteSettings.delivery?.insideDhaka || 0,
        outsideDhaka: siteSettings.delivery?.outsideDhaka || 0,
      }}
      paymentInstructions={{
        partialPayment: siteSettings.paymentInstructions?.partialPayment || '',
        fullPayment: siteSettings.paymentInstructions?.fullPayment || '',
      }}
    />
  )
}
