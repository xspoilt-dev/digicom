"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { getApiUrl } from "@/lib/api";
import { formatBanglaPrice } from "@/utils/bengali";

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartCount,
  } = useCart();
  const router = useRouter();
  const apiUrl = getApiUrl();

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={closeCart}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-base-100 text-base-content h-full shadow-2xl flex flex-col border-l border-amber-200/80 z-10 animate-slideLeft">
        {/* Drawer Header */}
        <div className="p-5 border-b border-amber-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-black text-stone-900">আপনার শপিং কার্ট</h2>
              <span className="text-[11px] text-stone-500 font-semibold">
                {cartCount}টি পণ্য যোগ করা হয়েছে
              </span>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="btn btn-sm btn-circle btn-ghost text-stone-500 hover:text-stone-900 hover:bg-amber-100/60"
            aria-label="Close Cart"
          >
            ✕
          </button>
        </div>

        {/* Drawer Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-100/80 text-amber-500 flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900">আপনার কার্ট বর্তমানে খালি!</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  আপনার প্রয়োজনীয় প্রিমিয়াম একাউন্ট ও সাবস্ক্রিপশন কার্টে যোগ করুন।
                </p>
              </div>
              <Link
                href="/shop"
                onClick={closeCart}
                className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 font-black border-none rounded-full px-6 btn-sm shadow-md"
              >
                শপ দেখুন
              </Link>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-3 p-3 bg-amber-50/30 rounded-2xl border border-amber-200/70 hover:border-amber-400 transition-all shadow-2xs"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-white border border-amber-200/80 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                  {item.thumbnailPath ? (
                    <img
                      src={`${apiUrl}/${item.thumbnailPath}`}
                      alt={item.title}
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    <span className="text-amber-500 font-bold text-xs">DIGI</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={closeCart}
                    className="text-xs font-bold text-stone-900 hover:text-amber-600 truncate block transition-colors"
                  >
                    {item.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-black text-amber-600">
                      {formatBanglaPrice(item.price)}
                    </span>
                    {item.compareAtPrice && item.compareAtPrice > item.price && (
                      <span className="text-[10px] text-stone-400 line-through">
                        {formatBanglaPrice(item.compareAtPrice)}
                      </span>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-amber-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs text-stone-700 hover:bg-amber-100 font-bold"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-black text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-2 py-0.5 text-xs text-stone-700 hover:bg-amber-100 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-stone-400 hover:text-error text-xs font-medium ml-auto flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      মুছুন
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-amber-100 bg-white space-y-4 shadow-lg">
            {/* Delivery Info */}
            <div className="flex items-center justify-between text-xs text-stone-600 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50">
              <span className="flex items-center gap-1.5 font-bold text-stone-700">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                ইনস্ট্যান্ট ডিজিটাল ডেলিভারি
              </span>
              <span className="text-success font-black">ফ্রি</span>
            </div>

            {/* Total Row */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-stone-600">সর্বমোট প্রদেয়:</span>
              <span className="text-2xl font-black text-amber-600">{formatBanglaPrice(cartTotal)}</span>
            </div>

            {/* Checkout Action */}
            <div className="space-y-2">
              <button
                onClick={handleCheckoutClick}
                className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 font-black border-none w-full rounded-2xl py-3 shadow-md text-sm transition-all hover:scale-[1.02]"
              >
                চেকআউট করুন ({formatBanglaPrice(cartTotal)})
              </button>
              <button
                onClick={closeCart}
                className="btn btn-ghost btn-sm text-stone-600 hover:text-stone-900 w-full font-bold text-xs"
              >
                আরও পণ্য যোগ করুন
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
