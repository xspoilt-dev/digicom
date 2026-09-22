"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Search, ShoppingCart, ShoppingBag, Layers } from "lucide-react";
import { getApiUrl } from "@/lib/api";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<{ _id?: string; name: string; slug: string }[]>([]);
  const { cartCount, openCart } = useCart();
  const router = useRouter();

  const apiUrl = getApiUrl();

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`${apiUrl}/api/categories`);
        const data = await res.json();
        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories.slice(0, 8));
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadCategories();
  }, [apiUrl]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-xs border-b border-amber-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="navbar min-h-16 p-0 flex items-center justify-between gap-4">
          {/* Logo Brand */}
          <div className="navbar-start gap-2 w-auto shrink-0">
            <Link href="/" className="flex items-center group py-1" aria-label="Kalobazar.shop Home">
              <img
                src="/horizontal.png"
                alt="Kalobazar.shop"
                className="h-10 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform drop-shadow-xs"
              />
            </Link>
          </div>

          {/* Center Search Bar (Expanded on PC desktop) */}
          <div className="navbar-center hidden md:flex flex-1 max-w-lg lg:max-w-xl mx-4">
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
                className="btn btn-circle btn-sm btn-ghost absolute right-1 text-stone-500 hover:text-amber-700"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Navigation Right (Shop + Cart Button) */}
          <div className="navbar-end gap-2 sm:gap-3 w-auto shrink-0">
            <Link
              href="/shop"
              className="btn btn-ghost btn-sm font-bold text-xs sm:text-sm text-stone-700 hover:text-amber-700 rounded-full px-3"
            >
              সকল পণ্য
            </Link>

            {/* Cart Trigger Button */}
            <button
              onClick={openCart}
              className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none btn-sm rounded-full font-black shadow-xs flex items-center gap-1.5 px-3.5 sm:px-4 active:scale-95"
              aria-label="Open Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
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
              className="btn btn-circle btn-xs btn-ghost absolute right-1 text-stone-500 hover:text-amber-700"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Desktop Quick Category Strip */}
        {categories.length > 0 && (
          <div className="hidden md:flex items-center gap-2 py-2 border-t border-amber-100/70 overflow-x-auto text-xs">
            <span className="font-bold text-stone-400 shrink-0 text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-500" />
              ক্যাটাগরি:
            </span>
            <Link
              href="/shop"
              className="px-2.5 py-1 rounded-lg text-stone-700 hover:text-amber-800 hover:bg-amber-50 font-semibold transition-colors shrink-0 text-xs"
            >
              সব পণ্য
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="px-2.5 py-1 rounded-lg text-stone-700 hover:text-amber-800 hover:bg-amber-50 font-semibold transition-colors shrink-0 text-xs"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
