'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { useCart } from '@/components/CartContext'

export default function OrderSuccessPage() {
  const { clearCart } = useCart()

  useEffect(() => {
    // Clear cart upon successful order
    clearCart()
  }, [])

  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-lg">
      <div className="flex justify-center mb-6">
        <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-4 text-primary">পেমেন্ট সফল হয়েছে!</h1>
      <p className="text-muted-foreground mb-8">
        আপনার কেনাকাটার জন্য ধন্যবাদ। আমরা আপনার ইমেইল ঠিকানায় ডিজিটাল প্রোডাক্টগুলো পাঠিয়ে দিয়েছি। অনুগ্রহ করে আপনার ইনবক্স চেক করুন।
      </p>
      <Link
        href="/"
        className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
      >
        কেনাকাটা চালিয়ে যান
      </Link>
    </div>
  )
}
