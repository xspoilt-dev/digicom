import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import axios from 'axios'

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config })
    const data = await req.json()
    const { items, customer, total } = data

    // 1. Create Order in pending status
    const order = await payload.create({
      collection: 'orders',
      data: {
        customer: {
          fullname: customer.fullname,
          email: customer.email,
        },
        items: items.map((item: any) => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
        })),
        total: total,
        paymentMethod: 'uddoktapay',
        status: 'pending',
      },
    })

    // 2. Init UddoktaPay
    const apiKey = process.env.UDDOKTAPAY_API_KEY
    const baseUrl = process.env.UDDOKTAPAY_BASE_URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    if (!apiKey || !baseUrl) {
      console.warn("UddoktaPay credentials missing, simulating success for development")
      return NextResponse.json({ payment_url: `${siteUrl}/order-success?invoice_id=${order.id}` })
    }

    const upPayload = {
      full_name: customer.fullname,
      email: customer.email,
      amount: total.toString(),
      metadata: {
        order_id: order.id.toString()
      },
      redirect_url: `${siteUrl}/order-success`,
      return_type: "GET",
      cancel_url: `${siteUrl}/checkout`,
      webhook_url: `${siteUrl}/api/webhook/uddoktapay`
    }

    const response = await axios.post(`${baseUrl}/api/checkout-v2`, upPayload, {
      headers: {
        'RT-UDDOKTAPAY-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    })

    return NextResponse.json({ payment_url: response.data.payment_url })

  } catch (error: any) {
    console.error('Checkout error:', error?.response?.data || error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
