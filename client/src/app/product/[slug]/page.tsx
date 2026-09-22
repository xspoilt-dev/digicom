"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Zap,
  Star,
  Eye,
  TrendingUp,
  Minus,
  Plus,
  ChevronRight,
  Package,
  Tag,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { trackEvent } from "@/lib/meta/track-event";

interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category?: string;
  type: "course" | "pdf" | "video" | "zip" | "account" | "slot" | "license" | "other";
  thumbnailPath?: string;
  duration?: string;
  pageCount?: number;
  version?: string;
  checkoutFields: string[];
  active?: boolean;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [addedToCart, setAddedToCart] = useState(false);

  const { addToCart } = useCart();
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    async function loadProductData() {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/api/products/${slug}`);
        const data = await res.json();
        if (data.success && data.product) {
          setProduct(data.product);
          trackEvent("ViewContent", {
            content_ids: [data.product._id],
            content_name: data.product.title,
            content_type: "product",
            value: data.product.price,
            currency: "BDT",
          });
        } else {
          setError(data.message || "প্রোডাক্টটি খুঁজে পাওয়া যায়নি।");
        }

        const allRes = await fetch(`${apiUrl}/api/products`);
        const allData = await allRes.json();
        if (allData.success && allData.products) {
          const others = allData.products.filter(
            (p: Product) => p.slug !== slug && p.active !== false
          );
          setRelatedProducts(others.slice(0, 4));
        }
      } catch (err) {
        setError("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।");
      } finally {
        setLoading(false);
      }
    }
    loadProductData();
  }, [slug, apiUrl]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(
      {
        productId: product._id,
        title: product.title,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        thumbnailPath: product.thumbnailPath,
        type: product.type,
        slug: product.slug,
      },
      quantity
    );
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(
      {
        productId: product._id,
        title: product.title,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        thumbnailPath: product.thumbnailPath,
        type: product.type,
        slug: product.slug,
      },
      quantity
    );
    router.push("/checkout");
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafaf9]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <span className="loading loading-spinner loading-lg text-amber-500"></span>
          <span className="text-stone-500 font-medium text-sm">লোড হচ্ছে...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafaf9]">
        <Navbar />
        <main className="container mx-auto px-4 py-16 flex-1 flex items-center justify-center">
          <div className="card w-full max-w-md bg-white border border-stone-200 shadow-sm rounded-2xl p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <Package className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-stone-900">পণ্যটি পাওয়া যায়নি</h2>
            <p className="text-sm text-stone-500">{error || "অনুরোধকৃত পণ্যটি বর্তমানে উপলব্ধ নেই।"}</p>
            <Link
              href="/shop"
              className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold border-none rounded-xl px-6"
            >
              সকল পণ্য দেখুন
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const comparePrice = product.compareAtPrice && product.compareAtPrice > product.price
    ? product.compareAtPrice
    : Math.round(product.price * 1.8);

  const categorySlug = product.category || product.type;

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] text-stone-900 pb-20 lg:pb-0">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex-1 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-stone-400 mb-6 font-medium flex-wrap">
          <Link href="/" className="hover:text-amber-600 transition-colors">হোম</Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <Link href="/shop" className="hover:text-amber-600 transition-colors">শপ</Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <Link href={`/category/${categorySlug}`} className="hover:text-amber-600 transition-colors capitalize">
            {getProductTypeLabel(product.type)}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-stone-700 font-bold line-clamp-1">{product.title}</span>
        </nav>

        {/* 2-Column Responsive Layout (Stacked on Mobile, 2-Column on Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start mb-12">
          
          {/* Left Column (5 Cols on PC): Image & Trust Badges */}
          <div className="lg:col-span-5 space-y-4">
            {/* Image Card */}
            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden p-3 sm:p-4">
              <div className="relative w-full aspect-square bg-stone-50 rounded-2xl overflow-hidden group flex items-center justify-center p-3">
                {product.thumbnailPath ? (
                  <img
                    src={`${apiUrl}/${product.thumbnailPath}`}
                    alt={product.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-xs"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-stone-400">
                    <Package className="w-16 h-16" strokeWidth={1} />
                    <span className="text-xs font-semibold uppercase tracking-widest">
                      {getProductTypeLabel(product.type)}
                    </span>
                  </div>
                )}

                {/* Discount Badge */}
                {discountPercent && (
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-xl shadow-xs">
                      <Tag className="w-3.5 h-3.5" />
                      {discountPercent}% OFF
                    </span>
                  </div>
                )}

                {/* Type Badge */}
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 bg-white/95 text-stone-900 border border-stone-200 text-xs font-bold px-3 py-1 rounded-xl shadow-xs">
                    {getProductTypeLabel(product.type)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols on PC): Product Title, Pricing, Actions, Description */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            
            {/* Category / Type Badge */}
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200">
                <Package className="w-3.5 h-3.5" />
                {getProductTypeLabel(product.type)}
              </span>
            </div>

            {/* Product Title & Proof Indicators (Down the Title) */}
            <div className="space-y-2.5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900 leading-snug">
                {product.title}
              </h1>

              {/* Proof Indicators: Rating, Views, In-Demand & Duration */}
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap pt-0.5">
                <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-stone-800 ml-1">4.9</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
                  <Eye className="w-3 h-3 text-stone-400" />
                  ৮৫০+ ভিউ
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <TrendingUp className="w-3 h-3 text-amber-600" />
                  ইন ডিমান্ড
                </span>
                {product.duration && (
                  <span className="inline-flex items-center gap-1 text-xs text-stone-600 bg-stone-50 px-2.5 py-1 rounded-full border border-stone-200 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>মেয়াদ: <strong className="text-stone-800">{product.duration}</strong></span>
                  </span>
                )}
              </div>
            </div>

            {/* Price Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-amber-50/70 via-stone-50 to-white rounded-2xl border border-amber-200/80 gap-3">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-stone-900">
                  ৳{product.price}
                </span>
                <span className="text-base sm:text-lg text-stone-400 line-through font-semibold">
                  ৳{comparePrice}
                </span>
                {discountPercent && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-200">
                    ৳{comparePrice - product.price} সাশ্রয়
                  </span>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 self-start sm:self-auto">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                অফিশিয়াল স্টক এভেইলেবল
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 py-2 border-y border-stone-100">
              <span className="text-sm font-bold text-stone-700">পরিমাণ:</span>
              <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 py-2 text-sm font-black text-stone-900 min-w-[2.5rem] text-center border-x border-stone-300">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-sm text-stone-500 font-medium">
                সর্বমোট: <strong className="text-stone-900 font-black">৳{product.price * quantity}</strong>
              </span>
            </div>

            {/* Action Buttons: Cart + Buy Now */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleAddToCart}
                className={`btn rounded-2xl font-bold text-sm h-12 min-h-0 flex items-center justify-center gap-2 border-2 transition-all shadow-xs active:scale-95 ${
                  addedToCart
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-stone-900 border-stone-300 hover:border-amber-400 hover:bg-amber-50/50"
                }`}
              >
                {addedToCart ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    কার্টে যোগ হয়েছে!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 text-stone-700" />
                    কার্টে যোগ করুন
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-2xl font-bold text-sm h-12 min-h-0 flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <Zap className="w-4 h-4" />
                এখনই অর্ডার করুন
              </button>
            </div>

            {/* Product Description Section */}
            <div className="pt-4 border-t border-stone-100">
              <h2 className="text-base font-bold text-stone-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                পণ্য সম্পর্কিত বিবরণ ও সুযোগ-সুবিধা
              </h2>

              <div className="text-sm text-stone-600 leading-relaxed space-y-3">
                <p className="font-medium text-stone-800 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                  {product.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {[
                    `মেয়াদ: ${product.duration || "১ মাস / ১ বছর নির্ধারিত"}`,
                    "১০০% অফিসিয়াল ও নিরাপদ সার্ভিস",
                    "সম্পূর্ণ মেয়াদকালীন সাপোর্ট ও ওয়ারেন্টি",
                    "তাৎক্ষণিক অটোমেটিক ডিজিটাল ডেলিভারি",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-stone-700 bg-white border border-stone-200/80 p-2.5 rounded-xl shadow-2xs">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-semibold">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Page Link */}
            <div className="pt-2">
              <Link
                href={`/category/${categorySlug}`}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-stone-600 hover:text-amber-700 border border-stone-200 hover:border-amber-400 rounded-xl transition-colors bg-stone-50/50 hover:bg-amber-50/30"
              >
                <Package className="w-4 h-4 text-amber-600" />
                <span>{getProductTypeLabel(product.type)} ক্যাটাগরির অন্যান্য সব পণ্য দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
              </Link>
            </div>
          </div>
        </div>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-200/80">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-amber-400 rounded-full"></div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900">সম্পর্কিত অন্যান্য পণ্যসমূহ</h2>
              </div>
              <Link
                href="/shop"
                className="text-xs sm:text-sm font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
              >
                <span>সব দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
              {relatedProducts.map((p) => {
                const discount =
                  p.compareAtPrice && p.compareAtPrice > p.price
                    ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
                    : null;

                return (
                  <div
                    key={p._id}
                    className="bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                  >
                    <Link href={`/product/${p.slug}`} className="block">
                      <figure className="relative aspect-square bg-stone-50 overflow-hidden flex items-center justify-center p-2.5">
                        {p.thumbnailPath ? (
                          <img
                            src={`${apiUrl}/${p.thumbnailPath}`}
                            alt={p.title}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xs"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-10 h-10 text-stone-300" />
                          </div>
                        )}
                        {discount ? (
                          <span className="absolute top-2 left-2 bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                            {discount}% ছাড়
                          </span>
                        ) : (
                          <span className="absolute top-2 left-2 bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                            অফার
                          </span>
                        )}
                        <span className="absolute top-2 right-2 bg-white/95 text-stone-800 font-bold text-[9px] px-2 py-0.5 rounded-md shadow-xs border border-stone-200">
                          {getProductTypeLabel(p.type)}
                        </span>
                      </figure>
                    </Link>

                    <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2">
                      <div>
                        <Link href={`/product/${p.slug}`} className="block">
                          <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-amber-700 line-clamp-2 leading-snug transition-colors">
                            {p.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1 mt-1.5">
                          <div className="flex items-center text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <span className="text-[11px] font-bold text-stone-700 ml-0.5">4.9</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-base sm:text-lg font-black text-stone-900">
                            ৳{p.price}
                          </span>
                          {p.compareAtPrice && p.compareAtPrice > p.price && (
                            <span className="text-xs text-stone-400 line-through">
                              ৳{p.compareAtPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() =>
                            addToCart({
                              productId: p._id,
                              title: p.title,
                              price: p.price,
                              compareAtPrice: p.compareAtPrice,
                              thumbnailPath: p.thumbnailPath,
                              type: p.type,
                              slug: p.slug,
                            })
                          }
                          className="w-full btn bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 hover:border-amber-400 rounded-xl btn-xs sm:btn-sm font-bold text-xs h-8 sm:h-9 min-h-0 flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-stone-700" />
                          <span>কার্ট</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            addToCart({
                              productId: p._id,
                              title: p.title,
                              price: p.price,
                              compareAtPrice: p.compareAtPrice,
                              thumbnailPath: p.thumbnailPath,
                              type: p.type,
                              slug: p.slug,
                            });
                            router.push("/checkout");
                          }}
                          className="w-full btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl btn-xs sm:btn-sm font-bold text-xs h-8 sm:h-9 min-h-0 flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                        >
                          <Zap className="w-3.5 h-3.5 text-stone-950" />
                          <span>কিনুন</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">সর্বমোট</div>
            <div className="text-lg font-black text-stone-900 leading-none">৳{product.price * quantity}</div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`btn rounded-xl font-bold text-xs h-10 min-h-0 flex items-center justify-center gap-1.5 border-2 transition-all ${
                addedToCart
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-stone-900 border-stone-300"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {addedToCart ? "যোগ হয়েছে!" : "কার্ট"}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold text-xs h-10 min-h-0 flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              অর্ডার করুন
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
