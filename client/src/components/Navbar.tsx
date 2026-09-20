"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const { cartCount, openCart } = useCart();
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-xs border-b border-amber-200/80">
      <div className="container mx-auto px-4 md:px-8">
        <div className="navbar min-h-16 p-0 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="navbar-start gap-2 w-auto">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-xl shadow-xs group-hover:scale-105 transition-transform">
                D
              </div>
              <div>
                <span className="text-lg md:text-xl font-black tracking-tight text-stone-900 group-hover:text-amber-600 transition-colors">
                  Digitalcorebd.com
                </span>
                <div className="text-[10px] text-amber-700 font-bold mt-[-3px] block">
                  ডিজিটাল একাউন্ট ও সাবস্ক্রিপশন
                </div>
              </div>
            </Link>
          </div>

          {/* Center Search Bar */}
          <div className="navbar-center hidden md:flex w-full max-w-md mx-6">
            <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
              <input
                type="text"
                placeholder="প্রয়োজনীয় একাউন্ট বা সাবস্ক্রিপশন খুঁজুন..."
                className="input input-bordered w-full pr-12 focus:outline-none focus:border-amber-400 rounded-full bg-amber-50/40 text-sm border-amber-200 text-stone-800 placeholder:text-stone-400 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-circle btn-sm btn-ghost absolute right-1 text-stone-500 hover:text-amber-600"
                aria-label="Search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Navigation Right (Shop + Cart Button) */}
          <div className="navbar-end gap-2 md:gap-3 w-auto">
            <Link
              href="/shop"
              className="btn btn-ghost btn-sm font-bold text-xs md:text-sm text-stone-700 hover:text-amber-600 rounded-full"
            >
              সব পণ্য
            </Link>

            {/* Cart Trigger Button */}
            <button
              onClick={openCart}
              className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none btn-sm rounded-full font-black shadow-xs flex items-center gap-1.5 px-3 md:px-4"
              aria-label="Open Shopping Cart"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="hidden sm:inline text-xs">কার্ট</span>
              {cartCount > 0 && (
                <span className="badge badge-xs bg-stone-950 text-white font-black px-1.5 py-2 rounded-full text-[10px]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
            <input
              type="text"
              placeholder="একাউন্ট বা সাবস্ক্রিপশন খুঁজুন..."
              className="input input-bordered w-full pr-10 focus:outline-none focus:border-amber-400 rounded-full bg-amber-50/40 text-xs border-amber-200 text-stone-800 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-circle btn-xs btn-ghost absolute right-1 text-stone-500 hover:text-amber-600"
              aria-label="Search"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
