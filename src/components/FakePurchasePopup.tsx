'use client'

import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag, X } from 'lucide-react'

const names = [
  'মিনহাজ',
  'রাকিব',
  'সাকিব',
  'ফাহিম',
  'আরিফ',
  'তানভীর',
  'রহিম',
  'করিম',
  'জাহিদ',
  'শামীম',
  'আশিক',
  'রনি',
  'হাসান',
]

export function FakePurchasePopup({ productNames = [] }: { productNames?: string[] }) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentName, setCurrentName] = useState('')
  const [currentProduct, setCurrentProduct] = useState('')
  const [timeAgo, setTimeAgo] = useState(1)

  useEffect(() => {
    // Initial delay before showing first popup
    const initialTimer = setTimeout(() => {
      showPopup()
    }, 5000)

    return () => clearTimeout(initialTimer)
  }, [])

  const showPopup = () => {
    const randomName = names[Math.floor(Math.random() * names.length)]
    
    // Fallback if no products passed
    const fallbackProducts = ['ডিজিটাল মার্কেটিং কোর্স', 'ওয়েব ডেভেলপমেন্ট প্যাক', 'ফ্রি প্রজেক্ট ফাইল', 'গ্রাফিক্স বান্ডেল']
    const productList = productNames.length > 0 ? productNames : fallbackProducts
    const randomProduct = productList[Math.floor(Math.random() * productList.length)]
    const randomTime = Math.floor(Math.random() * 15) + 1 // 1 to 15 mins ago

    setCurrentName(randomName)
    setCurrentProduct(randomProduct)
    setTimeAgo(randomTime)
    setIsVisible(true)

    // Hide after 6 seconds
    setTimeout(() => {
      setIsVisible(false)
      
      // Schedule next popup (random between 10 to 25 seconds)
      const nextDelay = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000
      setTimeout(() => {
        showPopup()
      }, nextDelay)
    }, 6000)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-4 left-4 z-50 w-80 md:w-96 bg-white rounded-lg shadow-xl shadow-black/10 border border-border p-4 flex gap-4 overflow-hidden"
        >
          {/* Notification Icon/Image */}
          <div className="shrink-0 pt-1">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 pr-4">
            <p className="text-base text-foreground leading-snug">
              <span className="font-bold">{currentName}</span> এইমাত্র <span className="font-bold text-primary">{currentProduct}</span> কিনেছেন!
            </p>
            <p className="text-sm text-muted-foreground mt-1.5">{timeAgo} মিনিট আগে</p>
          </div>

          {/* Close button */}
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
