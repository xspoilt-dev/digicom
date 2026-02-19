'use client'

import { ShoppingCart, X, Trash2, Minus, Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from './CartContext'
import { useRouter } from 'next/navigation'
import type { Dispatch, SetStateAction } from 'react'

interface CartDrawerProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

export default function CartDrawer({ isOpen, setIsOpen }: CartDrawerProps) {
  const { cartCount, items, updateQuantity, removeItem, cartTotal } = useCart()
  const router = useRouter()

  return (
    <>
      <div
        className={`fixed inset-0 z-50 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 z-50 h-screen bg-background shadow-xl w-[85vw] sm:w-full max-w-md flex-col flex transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Cart Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Shopping Cart ({cartCount})</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 hover:bg-muted text-foreground transition-colors"
            aria-label="Close cart"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-muted p-6 rounded-full">
                <ShoppingCart className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium text-foreground">Your cart is empty</h3>
              <p className="text-muted-foreground">
                Looks like you haven&apos;t added anything yet.
              </p>
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/product')
                }}
                className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={`${item.id}-${item.color}`} className="flex gap-4">
                  {/* Product Image */}
                  <div className="relative w-24 h-24 bg-muted rounded-md overflow-hidden shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-medium text-foreground line-clamp-2">{item.title}</h4>
                        <button
                          onClick={() => removeItem(item.id, item.color)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {item.color && (
                        <p className="text-sm text-muted-foreground mt-1">Color: {item.color}</p>
                      )}
                      <p className="font-semibold text-foreground mt-1">
                        TK {item.price.toLocaleString()}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.color)}
                        className="p-1 rounded-full border border-input hover:bg-muted text-foreground transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.color)}
                        className="p-1 rounded-full border border-input hover:bg-muted text-foreground transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-6 bg-muted/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-xl font-bold text-foreground">
                TK {cartTotal.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Shipping and taxes calculated at checkout.
            </p>
            <div className="grid gap-3">
              <Link
                href="/checkout"
                onClick={() => setIsOpen(false)}
                className="flex justify-center w-full bg-primary text-primary-foreground py-3 rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                Checkout
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-background border border-border text-foreground py-3 rounded-md hover:bg-muted transition-colors font-medium"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
