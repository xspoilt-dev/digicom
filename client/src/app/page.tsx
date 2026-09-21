"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/meta/track-event";
import { getFbCookies } from "@/lib/meta/cookies";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import {
  Play,
  FileText,
  Clock,
  BookOpen,
  Star,
  ShieldCheck,
  ShoppingCart,
  ShoppingBag,
  Zap,
  Package,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Folder,
} from "lucide-react";

interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  type: "course" | "pdf" | "video" | "zip" | "account" | "slot" | "license" | "other";
  thumbnailPath?: string;
  duration?: string;
  pageCount?: number;
  version?: string;
  showInSlider?: boolean;
  isFeatured?: boolean;
  displaySection?: string;
  checkoutFields: string[];
  isWebDisplay: boolean;
  curriculum: { title: string; duration?: string }[];
  active?: boolean;
}

// Lucide-based icon wrappers (keep same names so rest of JSX doesn't need changes)
const SearchIcon = () => <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const PlayIcon = () => <Play className="w-5 h-5" style={{ width: 20, height: 20 }} />;
const DocIcon = () => <FileText className="w-5 h-5" style={{ width: 20, height: 20 }} />;
const ClockIcon = () => <Clock className="w-4 h-4 text-primary" style={{ width: 16, height: 16, display: "inline-block" }} />;
const BookOpenIcon = () => <BookOpen className="w-4 h-4 text-primary" style={{ width: 16, height: 16, display: "inline-block" }} />;
const StarIcon = () => <Star className="w-5 h-5 text-amber-500 fill-amber-400" style={{ width: 20, height: 20 }} />;
const ShieldIcon = () => <ShieldCheck className="w-5 h-5 text-success" style={{ width: 20, height: 20 }} />;

export default function StoreHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [submittingCheckout, setSubmittingCheckout] = useState(false);
  const [categories, setCategories] = useState<{ _id: string; name: string; slug: string; description?: string; products: Product[] }[]>([]);

  // Cart & Router
  const { addToCart } = useCart();
  const router = useRouter();

  // Active banner slide
  const [activeSlide, setActiveSlide] = useState(0);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`${apiUrl}/api/products`),
          fetch(`${apiUrl}/api/categories`),
        ]);
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        if (productsData.success) {
          const list: Product[] = productsData.products || [];
          setProducts(list);
          setFilteredProducts(list);
        } else {
          setError(productsData.message || "পণ্য লোড করতে ব্যর্থ হয়েছে");
        }

        if (categoriesData.success) {
          setCategories(categoriesData.categories || []);
        }
      } catch (err: any) {
        setError("ব্যাকএন্ড সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [apiUrl]);

  // Handle local searching in-place
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const q = searchQuery.toLowerCase().trim();
      trackEvent("Search", { search_string: q });
      const filtered = products.filter(
        (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
      setFilteredProducts(filtered);
    }
  };

  const openCheckout = (product: Product) => {
    setSelectedProduct(product);
    trackEvent("ViewContent", {
      content_ids: [product._id],
      content_name: product.title,
      content_type: "product",
      value: product.price,
      currency: "BDT",
    });
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSubmittingCheckout(true);
    const fbCookies = getFbCookies();
    const eventId = trackEvent(
      "InitiateCheckout",
      {
        content_ids: [selectedProduct._id],
        content_name: selectedProduct.title,
        content_type: "product",
        value: selectedProduct.price,
        currency: "BDT",
        num_items: 1,
      },
      {
        email: formData.email,
        phone: formData.phone,
        skipCapi: true,
      }
    );

    try {
      const res = await fetch(`${apiUrl}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct._id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          paymentGateway: "zinipay",
          metaEventId: eventId,
          fbp: fbCookies.fbp,
          fbc: fbCookies.fbc,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else if (data.order?.orderId) {
          window.location.href = `/receipt/${data.order.orderId}`;
        }
      } else {
        alert(data.message || "চেকআউট প্রসেস ব্যর্থ হয়েছে");
      }
    } catch (err) {
      alert("নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।");
    } finally {
      setSubmittingCheckout(false);
    }
  };

  // Helper to get friendly Bengali labels for digital product types
  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case "account":
        return "অ্যাকাউন্ট";
      case "slot":
        return "টিম স্লট";
      case "license":
        return "লাইসেন্স কী";
      case "course":
        return "ভিডিও কোর্স";
      case "pdf":
        return "ইবুক / গাইড";
      case "video":
        return "ভিডিও";
      case "zip":
        return "জিপ ফাইল";
      default:
        return "ডিজিটাল";
    }
  };

  // Products to show in the top slider (Admin controls via showInSlider or isFeatured)
  const sliderProducts = products.filter((p) => p.showInSlider && p.active !== false);
  const displaySliderProducts =
    sliderProducts.length > 0
      ? sliderProducts
      : products.filter((p) => p.isFeatured && p.active !== false).length > 0
      ? products.filter((p) => p.isFeatured && p.active !== false)
      : products.filter((p) => p.active !== false).slice(0, 3);

  // Featured products section (prioritizes products flagged as isFeatured by admin)
  const explicitlyFeatured = filteredProducts.filter((p) => p.isFeatured && p.active !== false);
  const displayFeaturedProducts =
    explicitlyFeatured.length > 0
      ? explicitlyFeatured
      : filteredProducts.slice(0, 3);

  // Catalog products (remaining items not in featured section, or all if none featured)
  const displayCatalogProducts =
    explicitlyFeatured.length > 0
      ? filteredProducts.filter((p) => !explicitlyFeatured.some((feat) => feat._id === p._id))
      : filteredProducts.slice(3);

  // Auto-advance slider if more than 1 item
  useEffect(() => {
    if (displaySliderProducts.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % displaySliderProducts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [displaySliderProducts.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200" data-theme="lightyellow">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <span className="text-primary font-bold">লোডিং হচ্ছে...</span>
        </div>
      </div>
    );
  }

  const currentSlideProduct = displaySliderProducts[activeSlide] || displaySliderProducts[0];

  return (
    <div className="min-h-screen flex flex-col bg-base-200" data-theme="lightyellow">
      
      {/* Navbar with brand, search and live cart */}
      <Navbar />

      {/* Top Slider Banner - Fully Responsive for Mobile & PC */}
      {currentSlideProduct && (
        <section className="container mx-auto px-4 md:px-8 mt-4 sm:mt-6">
          <div className="relative max-w-7xl mx-auto rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-50/90 via-yellow-50/70 to-white text-stone-900 p-3 sm:p-5 md:p-6 shadow-sm border-2 border-amber-300/80 overflow-hidden">
            
            {/* Prev Arrow */}
            {displaySliderProducts.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveSlide((prev) => (prev - 1 + displaySliderProducts.length) % displaySliderProducts.length)
                }
                className="absolute left-1.5 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-amber-100 text-stone-800 flex items-center justify-center transition-all shadow-xs border border-amber-200 active:scale-90"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Next Arrow */}
            {displaySliderProducts.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveSlide((prev) => (prev + 1) % displaySliderProducts.length)}
                className="absolute right-1.5 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-amber-100 text-stone-800 flex items-center justify-center transition-all shadow-xs border border-amber-200 active:scale-90"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Horizontal Content: Left Image, Right Details */}
            <div className="flex items-center gap-3 sm:gap-6 md:gap-8 px-6 sm:px-10 md:px-12">
              {/* Product Thumbnail (Left) */}
              <Link
                href={`/product/${currentSlideProduct.slug}`}
                className="w-20 sm:w-28 md:w-36 lg:w-44 aspect-[3/4] bg-white rounded-xl sm:rounded-2xl overflow-hidden shrink-0 border border-amber-200 block relative group shadow-2xs"
              >
                {currentSlideProduct.thumbnailPath ? (
                  <img
                    src={`${apiUrl}/${currentSlideProduct.thumbnailPath}`}
                    alt={currentSlideProduct.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-500">
                    <Package className="w-8 h-8 md:w-12 md:h-12" />
                  </div>
                )}
              </Link>

              {/* Product Details (Right) */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                {/* Type Badge on Desktop */}
                <div className="hidden sm:inline-flex mb-1">
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {getProductTypeLabel(currentSlideProduct.type)}
                  </span>
                </div>

                {/* Title */}
                <Link
                  href={`/product/${currentSlideProduct.slug}`}
                  className="hover:text-amber-700 transition-colors block"
                >
                  <h2 className="text-xs sm:text-base md:text-xl lg:text-2xl font-black text-stone-900 leading-snug line-clamp-2">
                    {currentSlideProduct.title}
                  </h2>
                </Link>

                {/* Description snippet on Desktop */}
                {currentSlideProduct.description && (
                  <p className="hidden md:block text-xs lg:text-sm text-stone-600 mt-1 line-clamp-2 max-w-2xl">
                    {currentSlideProduct.description}
                  </p>
                )}

                {/* Price Row (Main Price + Strikethrough + Discount Badge) */}
                <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2.5 flex-wrap">
                  <span className="text-sm sm:text-lg md:text-2xl font-black text-amber-600">
                    ৳{currentSlideProduct.price}
                  </span>
                  {currentSlideProduct.compareAtPrice && currentSlideProduct.compareAtPrice > currentSlideProduct.price ? (
                    <>
                      <span className="text-xs sm:text-sm text-stone-400 line-through">
                        ৳{currentSlideProduct.compareAtPrice}
                      </span>
                      <span className="text-[10px] sm:text-xs bg-amber-400 text-stone-950 font-bold px-2 py-0.5 rounded-md shadow-2xs">
                        {Math.round(
                          ((currentSlideProduct.compareAtPrice - currentSlideProduct.price) /
                            currentSlideProduct.compareAtPrice) *
                            100
                        )}
                        % ছাড়
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs sm:text-sm text-stone-400 line-through">
                        ৳{Math.round(currentSlideProduct.price * 1.5)}
                      </span>
                      <span className="text-[10px] sm:text-xs bg-amber-400 text-stone-950 font-bold px-2 py-0.5 rounded-md shadow-2xs">
                        অফার
                      </span>
                    </>
                  )}
                </div>

                {/* Action Button: Golden-Yellow 'এখনই কিনুন' button */}
                <div className="mt-2 sm:mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      addToCart({
                        productId: currentSlideProduct._id,
                        title: currentSlideProduct.title,
                        price: currentSlideProduct.price,
                        compareAtPrice: currentSlideProduct.compareAtPrice,
                        thumbnailPath: currentSlideProduct.thumbnailPath,
                        type: currentSlideProduct.type,
                        slug: currentSlideProduct.slug,
                      });
                      router.push("/checkout");
                    }}
                    className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl sm:rounded-2xl btn-xs sm:btn-sm md:btn-md h-7 sm:h-9 md:h-10 px-3 sm:px-5 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 sm:gap-2 shadow-2xs active:scale-95"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>এখনই কিনুন</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Pagination Dots at Bottom */}
            {displaySliderProducts.length > 1 && (
              <div className="flex justify-center items-center gap-1 mt-2.5 sm:mt-3">
                {displaySliderProducts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeSlide ? "w-6 sm:w-8 bg-amber-500" : "w-1.5 sm:w-2 bg-amber-200 hover:bg-amber-300"
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Trust & Value Proposition Strip (Desktop & Mobile) */}
      <section className="container mx-auto px-4 md:px-8 mt-4 sm:mt-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-2xs hover:border-amber-400 transition-all">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100/90 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">তাৎক্ষণিক ডেলিভারি</h4>
              <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5">পেমেন্টের সাথে সাথেই অটোমেশন</p>
            </div>
          </div>

          <div className="bg-white border border-stone-200/90 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-2xs hover:border-amber-400 transition-all">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100/90 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">১০০% ভেরিফাইড</h4>
              <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5">অফিশিয়াল প্রিমিয়াম সার্ভিস</p>
            </div>
          </div>

          <div className="bg-white border border-stone-200/90 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-2xs hover:border-amber-400 transition-all">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100/90 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">ফুল মেয়াদ ওয়ারেন্টি</h4>
              <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5">যেকোনো সমস্যায় রিপ্লেসমেন্ট</p>
            </div>
          </div>

          <div className="bg-white border border-stone-200/90 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-2xs hover:border-amber-400 transition-all">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100/90 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-400" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">২৪/৭ সাপোর্ট</h4>
              <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5">হোয়াটসঅ্যাপ হেল্পডেস্ক সুবিধা</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main product showcase — Category by Category */}
      <main className="container mx-auto px-4 md:px-8 py-8 flex-1 max-w-7xl">

        {error && (
          <div className="alert alert-error shadow-md mb-6 text-sm">
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <span className="loading loading-spinner loading-lg text-amber-500"></span>
            <span className="text-stone-400 text-sm">লোড হচ্ছে...</span>
          </div>
        ) : categories.length === 0 ? (
          /* No categories configured yet — fall back to flat product grid */
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1.5 h-6 bg-amber-400 rounded-full"></div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-800">সকল পণ্য</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} apiUrl={apiUrl} addToCart={addToCart} router={router} />
              ))}
            </div>
          </section>
        ) : (
          /* Category-by-category display — admin-controlled order */
          <div className="space-y-14">
            {categories.map((cat) => (
              cat.products.length > 0 && (
                <section key={cat._id} className="scroll-mt-6">
                  {/* Category Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-stone-200/80 gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-1.5 h-8 bg-amber-400 rounded-full mt-0.5 sm:mt-0"></div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-black text-stone-900 leading-tight">
                            {cat.name}
                          </h2>
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                            {cat.products.length}টি পণ্য
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* "সব পণ্য দেখুন" Button for that category route */}
                    <Link
                      href={`/category/${cat.slug}`}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-stone-900 hover:text-amber-800 bg-white hover:bg-amber-50 border border-stone-300 hover:border-amber-400 px-4 py-2 rounded-xl transition-all shadow-xs shrink-0 self-start sm:self-auto"
                    >
                      <span>সব পণ্য দেখুন</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                    </Link>
                  </div>

                  {/* 2-col mobile, 3-5 col desktop grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
                    {cat.products.map((product) => (
                      <ProductCard key={product._id} product={product} apiUrl={apiUrl} addToCart={addToCart} router={router} />
                    ))}
                  </div>

                  {/* Mobile "সব পণ্য দেখুন" bottom bar if 2+ products */}
                  <div className="sm:hidden mt-3">
                    <Link
                      href={`/category/${cat.slug}`}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors border border-stone-200"
                    >
                      <span>{cat.name}-এর সব পণ্য দেখুন ({cat.products.length})</span>
                      <ArrowRight className="w-3 h-3 text-amber-600" />
                    </Link>
                  </div>
                </section>
              )
            ))}
          </div>
        )}

        {/* Shop CTA */}
        <div className="mt-14 py-8 text-center border-t border-stone-200/80">
          <p className="text-sm text-stone-500 mb-3 font-medium">আরও বিস্তারিত ও উন্নত ফিল্টারিং করতে আমাদের পুরো ক্যাটালগ দেখুন</p>
          <Link href="/shop" className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold border-none rounded-full px-8 shadow-sm">
            সকল পণ্য ও শপ ব্রাউজ করুন
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}

// ─── Reusable Product Card ───────────────────────────────────────────────────

function ProductCard({
  product,
  apiUrl,
  addToCart,
  router,
}: {
  product: any;
  apiUrl: string;
  addToCart: (item: any) => void;
  router: any;
}) {
  const getLabel = (type: string) => {
    const map: Record<string, string> = {
      account: "Account", slot: "Slot", license: "License",
      course: "Course", pdf: "PDF", video: "Video", zip: "ZIP", other: "Digital",
    };
    return map[type] || "Digital";
  };

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group">
      {/* Product Image */}
      <Link href={`/product/${product.slug}`} className="block">
        <figure className="relative aspect-square sm:aspect-[4/3] bg-stone-100 overflow-hidden">
          {product.thumbnailPath ? (
            <img
              src={`${apiUrl}/${product.thumbnailPath}`}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-stone-300" />
            </div>
          )}

          {/* Top-Left Discount Badge */}
          {discountPercent ? (
            <span className="absolute top-2 left-2 bg-amber-500 text-white font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-lg shadow-xs">
              {discountPercent}% ছাড়
            </span>
          ) : (
            <span className="absolute top-2 left-2 bg-amber-500 text-white font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-lg shadow-xs">
              অফার
            </span>
          )}

          {/* Type Badge on Top-Right */}
          <span className="absolute top-2 right-2 bg-white/95 text-stone-800 font-bold text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md shadow-xs border border-stone-200">
            {getLabel(product.type)}
          </span>
        </figure>
      </Link>

      {/* Card Body */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Title */}
          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-amber-700 line-clamp-2 leading-snug transition-colors">
              {product.title}
            </h3>
          </Link>

          {/* Star Rating Row (as in screenshot) */}
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
}
