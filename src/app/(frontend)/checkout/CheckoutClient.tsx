'use client'

import React, { useState } from 'react'
import { useCart } from '@/components/CartContext'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

type CheckoutClientProps = {
  deliveryArgs: {
    insideDhaka: number
    outsideDhaka: number
  }
  paymentInstructions: {
    partialPayment: string
    fullPayment: string
  }
}

type PaymentMethod = 'cash_on_delivery' | 'partial_delivery_charge' | 'full_payment'

export default function CheckoutClient({
  deliveryArgs,
  paymentInstructions,
}: CheckoutClientProps) {
  const { items, updateQuantity, removeItem, cartTotal, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shippingLocation, setShippingLocation] = useState<'inside' | 'outside'>('inside')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery')
  const [trxId, setTrxId] = useState('')

  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    email: '',
    address: '',
    note: '',
  })

  // Calculate totals
  const deliveryCharge =
    shippingLocation === 'inside' ? deliveryArgs.insideDhaka : deliveryArgs.outsideDhaka
  const finalTotal = cartTotal + deliveryCharge
  const requiresTransaction = paymentMethod !== 'cash_on_delivery'
  const paymentAmount =
    paymentMethod === 'partial_delivery_charge'
      ? deliveryCharge
      : paymentMethod === 'full_payment'
        ? finalTotal
        : 0
  const selectedPaymentInstruction =
    paymentMethod === 'partial_delivery_charge'
      ? paymentInstructions.partialPayment
      : paymentMethod === 'full_payment'
        ? paymentInstructions.fullPayment
        : ''

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
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

      if (requiresTransaction && !trxId.trim()) {
        throw new Error('Please provide your transaction ID for this payment method')
      }

      const orderData = {
        customer: {
          fullname: formData.fullname,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        },
        items: items.map((item) => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price,
          color: item.color,
        })),
        total: finalTotal, // Include delivery charge in total
        paymentMethod,
        payment: requiresTransaction
          ? {
              trxId: trxId.trim(),
              amount: paymentAmount,
            }
          : undefined,
        note: formData.note,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errors?.[0]?.message || 'Failed to place order')
      }

      setIsSuccess(true)
      clearCart()
      window.scrollTo(0, 0)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4">Order Placed Successfully!</h1>
        <p className="text-muted-foreground mb-8">
          Thank you for your order. We will contact you shortly to confirm your delivery details.
        </p>
        <Link
          href="/"
          className="inline-block bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    )
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
          className="inline-block bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
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
        Back to Shopping
      </Link>

      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Cart Review Section */}
        <div className="order-2">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              Order Summary
              <span className="text-sm font-normal text-muted-foreground">
                ({items.length} items)
              </span>
            </h2>

            <div className="space-y-6 mb-6">
              {items.map((item) => (
                <div key={`${item.id}-${item.color}`} className="flex gap-4">
                  <div className="relative aspect-square w-20 h-20 bg-muted rounded-md overflow-hidden shrink-0">
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
                      <p className="text-sm text-muted-foreground mb-2">Color: {item.color}</p>
                    )}
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center border border-input rounded text-sm">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.color)}
                          className="px-2 py-1 hover:bg-accent border-r border-input"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.color)}
                          className="px-2 py-1 hover:bg-accent border-l border-input"
                        >
                          +
                        </button>
                      </div>
                      <div className="font-bold">
                        Tk {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>Tk {cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>Tk {deliveryCharge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-border pt-2 mt-2">
                <span>Total</span>
                <span>Tk {finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        </div>

        {/* Customer Details Form */}
        <div className="order-1">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Delivery Details</h2>

            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-md mb-6 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  name="fullname"
                  required
                  value={formData.fullname}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-black/20"
                    placeholder="017..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-black/20"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Full Address *</label>
                <textarea
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="House #123, Road #4, Block B..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Note (Optional)</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="Special delivery instructions..."
                />
              </div>
              {/* Shipping Location Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Shipping Area *</label>
                <div className="grid grid-cols-2 gap-4">
                  <label
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      shippingLocation === 'inside'
                        ? 'border-black bg-black/5 ring-1 ring-black'
                        : 'border-input hover:border-black/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="shippingLocation"
                        value="inside"
                        checked={shippingLocation === 'inside'}
                        onChange={() => setShippingLocation('inside')}
                        className="w-4 h-4 text-black accent-black"
                      />
                      <span className="font-medium">Inside Dhaka</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 ml-6">
                      Tk {deliveryArgs.insideDhaka.toLocaleString()}
                    </div>
                  </label>

                  <label
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      shippingLocation === 'outside'
                        ? 'border-black bg-black/5 ring-1 ring-black'
                        : 'border-input hover:border-black/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="shippingLocation"
                        value="outside"
                        checked={shippingLocation === 'outside'}
                        onChange={() => setShippingLocation('outside')}
                        className="w-4 h-4 text-black accent-black"
                      />
                      <span className="font-medium">Outside Dhaka</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 ml-6">
                      Tk {deliveryArgs.outsideDhaka.toLocaleString()}
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method *</label>
                <div className="space-y-3">
                  <label
                    className={`border rounded-lg p-3 cursor-pointer transition-all block ${
                      paymentMethod === 'cash_on_delivery'
                        ? 'border-black bg-black/5 ring-1 ring-black'
                        : 'border-input hover:border-black/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash_on_delivery"
                        checked={paymentMethod === 'cash_on_delivery'}
                        onChange={() => setPaymentMethod('cash_on_delivery')}
                        className="w-4 h-4 text-black accent-black"
                      />
                      <span className="font-medium">Cash on Delivery</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 ml-6">
                      Pay when you receive your order
                    </div>
                  </label>

                  <label
                    className={`border rounded-lg p-3 cursor-pointer transition-all block ${
                      paymentMethod === 'partial_delivery_charge'
                        ? 'border-black bg-black/5 ring-1 ring-black'
                        : 'border-input hover:border-black/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="partial_delivery_charge"
                        checked={paymentMethod === 'partial_delivery_charge'}
                        onChange={() => setPaymentMethod('partial_delivery_charge')}
                        className="w-4 h-4 text-black accent-black"
                      />
                      <span className="font-medium">Partial Payment (Delivery Charge)</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 ml-6">
                      Pay only delivery charge now: Tk {deliveryCharge.toLocaleString()}
                    </div>
                  </label>

                  <label
                    className={`border rounded-lg p-3 cursor-pointer transition-all block ${
                      paymentMethod === 'full_payment'
                        ? 'border-black bg-black/5 ring-1 ring-black'
                        : 'border-input hover:border-black/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="full_payment"
                        checked={paymentMethod === 'full_payment'}
                        onChange={() => setPaymentMethod('full_payment')}
                        className="w-4 h-4 text-black accent-black"
                      />
                      <span className="font-medium">Full Payment</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 ml-6">
                      Pay full order amount now: Tk {finalTotal.toLocaleString()}
                    </div>
                  </label>
                </div>
              </div>

              {requiresTransaction && (
                <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
                  <div>
                    <p className="text-sm font-medium mb-1">Payment Instructions</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {selectedPaymentInstruction ||
                        'Please follow the payment instructions provided by the store.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Transaction ID *</label>
                    <input
                      type="text"
                      name="trxId"
                      required={requiresTransaction}
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      className="w-full px-4 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="Enter your payment transaction ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Amount</label>
                    <input
                      type="text"
                      readOnly
                      value={`Tk ${paymentAmount.toLocaleString()}`}
                      className="w-full px-4 py-2 rounded-md border border-input bg-muted text-muted-foreground"
                    />
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
