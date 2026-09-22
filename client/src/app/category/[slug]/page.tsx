"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  ShieldCheck,
  Zap,
  Lock,
  CheckCircle,
  ShoppingCart,
  ShoppingBag,
  Star,
  ArrowRight,
  ChevronRight,
  Layers,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { getApiUrl } from "@/lib/api";
import { trackEvent } from "@/lib/meta/track-event";

interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  type: "course" | "pdf" | "video" | "zip" | "account" | "slot" | "license" | "other";
  category?: string;
  thumbnailPath?: string;
  duration?: string;
  pageCount?: number;
  active?: boolean;
}

interface CategoryInfo {
  name: string;
  slug: string;
  description?: string;
}

export default function CategoryCampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug.toLowerCase();

  const [categoryInfo, setCategoryInfo] = useState<CategoryInfo>({
    name: slug.toUpperCase(),
    slug,
    description: "",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<{ _id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const { addToCart } = useCart();
  const router = useRouter();
  const apiUrl = getApiUrl();

  useEffect(() => {
    async function loadCategoryData() {
      try {
        setLoading(true);
        // Fetch products and category info by slug
        const res = await fetch(`${apiUrl}/api/categories/${slug}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
          if (data.category) {
            setCategoryInfo({
              name: data.category.name || slug.toUpperCase(),
              slug: data.category.slug || slug,
              description: data.category.description || "",
            });
          }

          // Track Meta ViewCategory event for ad campaigns
          trackEvent("ViewCategory", {
            category_name: slug,
            num_items: data.products.length,
          });
        } else {
          // Fallback: fetch all products and filter locally
          const fallbackRes = await fetch(`${apiUrl}/api/products`);
          const fallbackData = await fallbackRes.json();
          if (fallbackData.success && Array.isArray(fallbackData.products)) {
            const filtered = fallbackData.products.filter(
              (p: Product) =>
                p.active !== false &&
                (p.category?.toLowerCase() === slug || p.type?.toLowerCase() === slug)
            );
            setProducts(filtered);
          }
        }

        // Fetch distinct categories for top pills
        const catRes = await fetch(`${apiUrl}/api/categories`);
        const catData = await catRes.json();
        if (catData.success && Array.isArray(catData.categories)) {
          setAllCategories(catData.categories);
        }
      } catch (err) {
        setError("ক্যাটাগরি পণ্য লোড করতে সমস্যা হয়েছে।");
      } finally {
        setLoading(false);
      }
    }

    loadCategoryData();
  }, [slug, apiUrl]);

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case "account": return "Private Account";
      case "slot": return "Team Slot";
      case "license": return "License Key";
      case "course": return "Video Course";
      case "pdf": return "eBook / PDF";
      case "video": return "Video Resource";
      case "zip": return "ZIP Package";
      default: return "Digital Product";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] text-stone-900">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex-1 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs font-semibold text-stone-500 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-amber-600 transition-colors">হোমপেজ</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link href="/shop" className="hover:text-amber-600 transition-colors">ক্যাটাগরি</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="text-stone-800 font-bold">{categoryInfo.name}</span>
        </nav>

        {/* Compact Campaign Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-100/80 via-yellow-50/70 to-white border border-amber-300/80 p-3.5 sm:p-5 md:p-6 shadow-xs mb-4 sm:mb-6">
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-1 bg-amber-400 text-stone-950 font-black text-[10px] uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-2xs mb-2">
              <Layers className="w-3 h-3" />
              ক্যাটাগরি
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-stone-900 leading-tight mb-2.5">
              {categoryInfo.name}
            </h1>

            {/* Compact Trust Badges Row */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] sm:text-xs font-bold text-stone-800">
              <span className="bg-white/95 border border-amber-200 px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-600" />
                অটো-ডেলিভারি
              </span>
              <span className="bg-white/95 border border-amber-200 px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600" />
                নিরাপদ পেমেন্ট
              </span>
              <span className="bg-white/95 border border-amber-200 px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                ফুল মেয়াদ ওয়ারেন্টি
              </span>
            </div>
          </div>
        </div>

        {/* Category Pills Navigation */}
        {allCategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 sm:mb-6 scrollbar-thin">
            <Link
              href="/shop"
              className="btn btn-xs sm:btn-sm rounded-full font-bold whitespace-nowrap bg-white border border-stone-200 text-stone-700 hover:border-amber-400 shadow-2xs"
            >
              সকল পণ্য
            </Link>
            {allCategories.map((cat) => (
              <Link
                key={cat._id || cat.slug}
                href={`/category/${cat.slug}`}
                className={`btn btn-xs sm:btn-sm rounded-full font-bold whitespace-nowrap transition-all shadow-2xs ${
                  slug === cat.slug
                    ? "bg-amber-400 text-stone-950 border-none shadow-xs font-black"
                    : "bg-white border border-stone-200 text-stone-700 hover:border-amber-400"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Product Listing - 2 products per row on mobile! */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="loading loading-spinner loading-md text-amber-500"></span>
            <span className="text-stone-500 font-bold text-xs">ক্যাম্পেইন পণ্য লোড হচ্ছে...</span>
          </div>
        ) : error ? (
          <div className="alert alert-error text-xs font-bold rounded-2xl mb-8">
            <span>{error}</span>
          </div>
        ) : products.length === 0 ? (
          <div className="card bg-white border-2 border-stone-200 rounded-3xl p-12 text-center shadow-sm max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <Package className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">এই ক্যাটাগরিতে বর্তমানে কোনো পণ্য নেই!</h3>
            <p className="text-xs text-stone-500 mt-1 mb-6">
              শীঘ্রই নতুন স্টক যুক্ত করা হবে। আমাদের অন্যান্য ক্যাটাগরি দেখতে নিচের বাটনে ক্লিক করুন।
            </p>
            <Link
              href="/shop"
              className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold border-none rounded-xl px-6 shadow-sm btn-sm mx-auto"
            >
              সকল পণ্য দেখুন
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs sm:text-sm font-bold text-stone-700">
                মোট <span className="text-amber-600 font-black">{products.length}টি</span> প্রোডাক্ট পাওয়া গেছে
              </span>
              <span className="text-[11px] font-bold text-stone-400">
                ক্যাম্পেইন URL: /category/{slug}
              </span>
            </div>

            {/* Mobile: 2 items per row (`grid-cols-2`), Desktop: up to 5 cols */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
              {products.map((product) => {
                const discount =
                  product.compareAtPrice && product.compareAtPrice > product.price
                    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                    : null;

                return (
                  <div
                    key={product._id}
                    className="bg-white shadow-sm border border-stone-200/90 hover:border-amber-400 hover:shadow-md transition-all rounded-2xl overflow-hidden flex flex-col justify-between group"
                  >
                    {/* Product Image */}
                    <Link href={`/product/${product.slug}`} className="block">
                      <figure className="relative aspect-square bg-stone-50 overflow-hidden flex items-center justify-center p-2.5">
                        {product.thumbnailPath ? (
                          <img
                            src={`${apiUrl}/${product.thumbnailPath}`}
                            alt={product.title}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xs"
                          />
                        ) : (
                          <div className="text-stone-300 flex items-center justify-center h-full">
                            <Package className="w-10 h-10" />
                          </div>
                        )}

                        {/* Top-Left Discount Badge */}
                        {discount ? (
                          <span className="absolute top-2 left-2 bg-amber-500 text-white font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-lg shadow-xs">
                            {discount}% ছাড়
                          </span>
                        ) : (
                          <span className="absolute top-2 left-2 bg-amber-500 text-white font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-lg shadow-xs">
                            অফার
                          </span>
                        )}

                        {/* Type Badge on Top-Right */}
                        <span className="absolute top-2 right-2 bg-white/95 text-stone-800 font-bold text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md shadow-xs border border-stone-200">
                          {getProductTypeLabel(product.type)}
                        </span>
                      </figure>
                    </Link>

                    {/* Card Body */}
                    <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2">
                      <div>
                        {/* Title */}
                        <Link href={`/product/${product.slug}`} className="block">
                          <h3 className="text-stone-900 text-xs sm:text-sm font-bold group-hover:text-amber-600 line-clamp-2 leading-snug transition-colors">
                            {product.title}
                          </h3>
                        </Link>

                        {/* Star Rating Row */}
                        <div className="flex items-center gap-1 mt-1.5">
                          <div className="flex items-center text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <span className="text-[11px] font-bold text-stone-700 ml-0.5">4.9</span>
                        </div>

                        {/* Price Row (Own Line) */}
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-base sm:text-lg font-black text-stone-900">
                            ৳{product.price}
                          </span>
                          {product.compareAtPrice && product.compareAtPrice > product.price ? (
                            <span className="text-xs text-stone-400 line-through">
                              ৳{product.compareAtPrice}
                            </span>
                          ) : (
                            <span className="text-xs text-stone-400 line-through">
                              ৳{Math.round(product.price * 1.5)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Buttons Row (Side-by-Side: Cart + Crimson Buy) */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            addToCart({
                              productId: product._id,
                              title: product.title,
                              price: product.price,
                              compareAtPrice: product.compareAtPrice,
                              thumbnailPath: product.thumbnailPath,
                              type: product.type,
                              slug: product.slug,
                            });
                          }}
                          className="w-full btn bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 hover:border-amber-400 rounded-xl btn-xs sm:btn-sm font-bold text-xs h-8 sm:h-9 min-h-0 flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95"
                          title="কার্টে যোগ করুন"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-stone-700" />
                          <span>কার্ট</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            addToCart({
                              productId: product._id,
                              title: product.title,
                              price: product.price,
                              compareAtPrice: product.compareAtPrice,
                              thumbnailPath: product.thumbnailPath,
                              type: product.type,
                              slug: product.slug,
                            });
                            router.push("/checkout");
                          }}
                          className="w-full btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl btn-xs sm:btn-sm font-bold text-xs h-8 sm:h-9 min-h-0 flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95"
                          title="এখনই কিনুন"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-stone-950" />
                          <span>কিনুন</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
