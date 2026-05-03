'use client'

import React, { useState } from 'react'
import { useCart } from '@/components/CartContext'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CheckoutClient() {
  const { items, updateQuantity, removeItem, cartTotal, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (items.length === 0) {
        throw new Error('Your cart is empty')
      }

      const orderData = {
        customer: {
          fullname: formData.fullname,
          email: formData.email,
        },
        items: items.map((item) => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        total: cartTotal,
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to initialize payment')
      }

      const data = await response.json()
      
      if (data.payment_url) {
        // Redirect to UddoktaPay
        window.location.href = data.payment_url
      } else {
         throw new Error('No payment URL received')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        কেনাকাটায় ফিরে যান
      </Link>

      <h1 className="text-3xl font-bold mb-8 text-primary">চেকআউট</h1>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Cart Review Section */}
        <div className="order-2">
          <div className="bg-card border border-primary/20 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              অর্ডারের সারসংক্ষেপ
              <span className="text-sm font-normal text-muted-foreground">
                ({items.length} টি আইটেম)
              </span>
            </h2>

            <div className="space-y-6 mb-6">
              {items.map((item) => (
                <div key={`${item.id}-${item.color}`} className="flex gap-4">
                  <div className="relative aspect-square w-20 h-20 bg-muted rounded-md overflow-hidden shrink-0 border border-primary/10">
                    {item.image && (
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium line-clamp-2">{item.title}</h3>
                      <button
                        onClick={() => removeItem(item.id, item.color)}
                        className="text-red-500 hover:text-red-600 ml-2"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {item.color && (
                      <p className="text-sm text-muted-foreground mb-2">রং: {item.color}</p>
                    )}
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center border border-primary/20 rounded text-sm bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.color)}
                          className="px-2 py-1 hover:bg-primary/10 border-r border-primary/20 text-primary"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.color)}
                          className="px-2 py-1 hover:bg-primary/10 border-l border-primary/20 text-primary"
                        >
                          +
                        </button>
                      </div>
                      <div className="font-bold text-primary">
                        Tk {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-primary/20 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">সাবটোটাল</span>
                <span>Tk {cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-primary/20 pt-2 mt-2">
                <span>মোট</span>
                <span className="text-primary">Tk {cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  পেমেন্ট প্রসেস হচ্ছে...
                </>
              ) : (
                'UddoktaPay দিয়ে পেমেন্ট করুন'
              )}
            </button>
          </div>
        </div>

        {/* Customer Details Form */}
        <div className="order-1">
          <div className="bg-card border border-primary/20 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-primary">আপনার বিবরণ</h2>

            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-md mb-6 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">পুরো নাম *</label>
                <input
                  type="text"
                  name="fullname"
                  required
                  value={formData.fullname}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ইমেইল *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
                  placeholder="john@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">আমরা আপনার ডিজিটাল প্রোডাক্টটি এই ইমেইলে পাঠিয়ে দেব।</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
