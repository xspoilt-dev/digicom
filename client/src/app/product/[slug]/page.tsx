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
  ShieldCheck,
  Truck,
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
      <div className="min-h-screen flex flex-col bg-[#fafaf9]" data-theme="lightyellow">
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
      <div className="min-h-screen flex flex-col bg-[#fafaf9]" data-theme="lightyellow">
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
    <div className="min-h-screen flex flex-col bg-[#fafaf9] text-stone-900 pb-20 md:pb-0" data-theme="lightyellow">
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 py-4 md:py-8 flex-1 max-w-3xl">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-5 font-medium">
          <Link href="/" className="hover:text-stone-600 transition-colors">হোম</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/category/${categorySlug}`} className="hover:text-stone-600 transition-colors capitalize">
            {getProductTypeLabel(product.type)}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-stone-600 line-clamp-1">{product.title}</span>
        </nav>

        {/* Product Card */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden mb-6">

          {/* Product Image */}
          <div className="relative w-full aspect-[16/9] sm:aspect-[4/3] bg-stone-100 overflow-hidden">
            {product.thumbnailPath ? (
              <img
                src={`${apiUrl}/${product.thumbnailPath}`}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-stone-400">
                <Package className="w-16 h-16" strokeWidth={1} />
                <span className="text-xs font-semibold uppercase tracking-widest">
                  {getProductTypeLabel(product.type)}
                </span>
              </div>
            )}

            {/* Discount badge */}
            {discountPercent && (
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                  <Tag className="w-3 h-3" />
                  {discountPercent}% OFF
                </span>
              </div>
            )}

            {/* Type badge */}
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 bg-amber-400 text-stone-950 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                {getProductTypeLabel(product.type)}
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4 sm:p-6">

            {/* Social proof row */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-xs font-bold text-stone-700 ml-1">4.9</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
                <Eye className="w-3 h-3" />
                835 views
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <TrendingUp className="w-3 h-3" />
                13 sold
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug mb-4">
              {product.title}
            </h1>

            {/* Price row */}
            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200 mb-5">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-black text-stone-900">
                  ৳{product.price}
                </span>
                <span className="text-sm text-stone-400 line-through font-medium">
                  ৳{comparePrice}
                </span>
                {discountPercent && (
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                    ৳{comparePrice - product.price} সাশ্রয়
                  </span>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" />
                স্টক আছে
              </div>
            </div>

            {/* Duration info */}
            {product.duration && (
              <div className="flex items-center gap-2 text-xs text-stone-500 mb-5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>মেয়াদ: <strong className="text-stone-700">{product.duration}</strong></span>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-5">
              <span className="text-sm font-semibold text-stone-600">পরিমাণ:</span>
              <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-100 transition-colors"
                  aria-label="Decrease"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 py-2 text-sm font-bold text-stone-900 min-w-[2.5rem] text-center border-x border-stone-300">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-100 transition-colors"
                  aria-label="Increase"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-stone-500">
                মোট: <strong className="text-stone-800">৳{product.price * quantity}</strong>
              </span>
            </div>

            {/* Action Buttons — Cart + Order Now */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={handleAddToCart}
                className={`btn rounded-xl font-bold text-sm h-11 min-h-0 flex items-center justify-center gap-2 border-2 transition-all ${
                  addedToCart
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-stone-900 border-stone-300 hover:border-amber-400 hover:bg-amber-50"
                }`}
              >
                {addedToCart ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Added!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    কার্টে যোগ করুন
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold text-sm h-11 min-h-0 flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all"
              >
                <Zap className="w-4 h-4" />
                এখনই অর্ডার করুন
              </button>
            </div>

            {/* Category page link */}
            <Link
              href={`/category/${categorySlug}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-stone-500 hover:text-amber-700 border border-stone-200 hover:border-amber-300 rounded-xl transition-colors bg-white"
            >
              <Package className="w-3.5 h-3.5" />
              এই ক্যাটাগরির সব পণ্য দেখুন
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-stone-200 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-800">১০০% সিকিউর পেমেন্ট</div>
              <div className="text-[11px] text-stone-500">বিকাশ, নগদ, রকেট, কার্ড</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-stone-200 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-800">তাৎক্ষণিক ডেলিভারি</div>
              <div className="text-[11px] text-stone-500">পেমেন্টের সাথে সাথেই</div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 mb-6">
          <h2 className="text-base font-bold text-stone-900 mb-4 pb-3 border-b border-stone-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            পণ্য সম্পর্কিত বিস্তারিত
          </h2>

          <div className="text-sm text-stone-600 leading-relaxed space-y-3">
            <p className="font-medium text-stone-800">{product.description}</p>
            <p>
              এটি একটি প্রিমিয়াম ডিজিটাল সার্ভিস। পেমেন্ট সম্পন্ন হওয়ার সাথে সাথে স্বয়ংক্রিয়ভাবে ডেলিভারি ক্রেডেনশিয়াল স্ক্রিন ও ইমেইলে পাঠানো হবে।
            </p>
            <ul className="space-y-2 pt-1">
              {[
                `মেয়াদ: ${product.duration || "১ মাস / ১ বছর"}`,
                "১০০% অফিসিয়াল ও ভেরিফাইড সার্ভিস",
                "মেয়াদকালীন সমস্যায় রিপ্লেসমেন্ট ওয়ারেন্টি",
                "২৪/৭ সাপোর্ট সুবিধা",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-stone-600">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-stone-900">সম্পর্কিত পণ্যসমূহ</h2>
              <Link
                href="/shop"
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                সব দেখুন <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {relatedProducts.map((p) => (
                <Link
                  key={p._id}
                  href={`/product/${p.slug}`}
                  className="bg-white rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all overflow-hidden group block"
                >
                  <figure className="relative h-28 sm:h-36 bg-stone-100 overflow-hidden">
                    {p.thumbnailPath ? (
                      <img
                        src={`${apiUrl}/${p.thumbnailPath}`}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-stone-300" />
                      </div>
                    )}
                    <span className="absolute top-2 right-2 bg-amber-400 text-stone-950 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      {getProductTypeLabel(p.type)}
                    </span>
                  </figure>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-stone-800 line-clamp-2 leading-snug mb-1">
                      {p.title}
                    </p>
                    <span className="text-sm font-black text-stone-900">৳{p.price}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Mobile Sticky Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 px-4 py-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <div className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">মূল্য</div>
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
              {addedToCart ? "Added!" : "কার্ট"}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold text-xs h-10 min-h-0 flex items-center justify-center gap-1.5"
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
