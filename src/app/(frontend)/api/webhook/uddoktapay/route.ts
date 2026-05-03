import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Resend } from 'resend'

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config })
    const data = await req.json()
    
    // Validate UddoktaPay Webhook Signature/Data
    const apiKey = process.env.UDDOKTAPAY_API_KEY
    const webhookHeader = req.headers.get('rt-uddoktapay-api-key')
    
    // In production, we'd verify the header or signature, depending on UddoktaPay webhook specs.
    // Assuming metadata contains order_id and status is provided
    
    const orderId = data.metadata?.order_id
    if (!orderId) {
      return NextResponse.json({ error: 'No order_id in metadata' }, { status: 400 })
    }

    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 2
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (data.status === 'COMPLETED' && order.status !== 'delivered') {
      // 1. Update order status
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: {
          status: 'delivered',
          payment: {
            invoice_id: data.invoice_id,
            trxId: data.transaction_id,
            amount: parseFloat(data.amount),
          }
        }
      })

      // 2. Fetch products and generate email content
      let emailContent = `<h1>Thank you for your purchase, ${order.customer.fullname}!</h1>`
      emailContent += `<p>Here are your digital products:</p><ul>`

      for (const item of order.items) {
        const product: any = item.product
        emailContent += `<li><strong>${product.name}</strong><br/>`
        
        if (product.digitalDelivery) {
          const method = product.digitalDelivery.deliveryMethod
          if (method === 'file_link') {
            emailContent += `Link: <a href="${product.digitalDelivery.fileLink}">${product.digitalDelivery.fileLink}</a>`
          } else if (method === 'credentials') {
            emailContent += `Email: ${product.digitalDelivery.credentials?.email} <br/> Password: ${product.digitalDelivery.credentials?.password}`
          } else if (method === 'pdf_upload' && product.digitalDelivery.pdfUpload) {
            const pdfUrl = process.env.NEXT_PUBLIC_SITE_URL + product.digitalDelivery.pdfUpload.url
            emailContent += `PDF Download: <a href="${pdfUrl}">Download</a>`
          }
        } else {
          emailContent += `(No digital delivery attached)`
        }
        emailContent += `</li>`
      }
      emailContent += `</ul>`

      // 3. Send email using Resend
      const resendApiKey = process.env.RESEND_API_KEY
      if (resendApiKey) {
        const resend = new Resend(resendApiKey)
        await resend.emails.send({
          from: 'delivered@resend.dev', // Default sender for dev
          to: order.customer.email,
          subject: 'Your Digital Products - Order #' + order.id,
          html: emailContent
        })
      } else {
        console.warn("RESEND_API_KEY missing, skipping email")
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
