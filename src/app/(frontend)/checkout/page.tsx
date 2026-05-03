import React from 'react'
import CheckoutClient from './CheckoutClient'

export const revalidate = false // Disable automatic revalidation

export default function CheckoutPage() {
  return (
    <CheckoutClient />
  )
}
