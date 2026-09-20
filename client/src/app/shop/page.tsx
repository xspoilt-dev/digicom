"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trackEvent } from "@/lib/meta/track-event";
import { getFbCookies } from "@/lib/meta/cookies";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, ShoppingBag, Star, Package } from "lucide-react";

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
  checkoutFields: string[];
  isWebDisplay: boolean;
  curriculum: { title: string; duration?: string }[];
}

// Icons
const SearchIcon = () => (
  <svg className="w-5 h-5 opacity-70 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "18px", height: "18px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DocIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

function ShopContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Cart & Router
  const { addToCart } = useCart();
  const router = useRouter();

  // Checkout State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`${apiUrl}/api/products`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
        } else {
          setError(data.message || "পণ্য লোড করতে ব্যর্থ হয়েছে");
        }
      } catch (err: any) {
        setError("ব্যাকএন্ড সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [apiUrl]);

  const openCheckout = (product: Product) => {
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

  // Filter calculations
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.type === selectedCategory;
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-base-200" data-theme="lightyellow">
      <Navbar />

      <main className="container mx-auto px-4 md:px-8 py-10 flex-1">
        {error && (
          <div className="alert alert-error shadow-md mb-8">
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Unified Top Inline Filter Layout */}
        <div className="card bg-base-100 p-6 rounded-3xl border border-base-300 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full">
            
            {/* Search input field */}
            <div className="relative w-full md:w-80 shrink-0">
              <input
                type="text"
                placeholder="পণ্য খুঁজুন..."
                className="input input-bordered w-full pr-10 focus:input-primary rounded-xl text-base-content bg-base-100"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60">
                <SearchIcon />
              </span>
            </div>

            {/* Scrollable Categories List */}
            <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin max-w-full flex-1">
              {[
                { key: "all", label: "সব ক্যাটাগরি" },
                { key: "account", label: "প্রাইভেট একাউন্ট" },
                { key: "slot", label: "টিম স্লট" },
                { key: "license", label: "লাইসেন্স কী" },
                { key: "course", label: "ভিডিও কোর্স" },
                { key: "pdf", label: "পিডিএফ বই" },
                { key: "video", label: "ভিডিও গাইড" },
                { key: "zip", label: "জিপ ফাইল" },
                { key: "other", label: "অন্যান্য" }
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`btn btn-sm rounded-full font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.key
                      ? "btn-primary text-primary-content"
                      : "btn-outline btn-ghost border-base-300 text-base-content"
                  }`}
                  onClick={() => {
                    setSelectedCategory(cat.key);
                    setCurrentPage(1);
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product showcase list */}
        <div className="space-y-8">
          
          {/* Summary results bar */}
          <div className="flex justify-between items-center bg-base-100 px-6 py-4 rounded-2xl border border-base-300 shadow-sm">
            <span className="text-sm font-bold text-base-content/85">
              মোট <span className="text-primary font-black">{filteredProducts.length}টি</span> প্রোডাক্ট পাওয়া গেছে
            </span>
            <span className="text-xs text-base-content/50 font-bold">
              পৃষ্ঠা: {currentPage} / {totalPages || 1}
            </span>
          </div>

          {/* List matched items */}
          {currentItems.length === 0 ? (
            <div className="card bg-base-100 p-16 text-center border border-base-300 shadow-sm rounded-3xl">
              <p className="text-base-content/65 font-bold text-lg">
                দুঃখিত, আপনার ফিল্টার অনুযায়ী কোনো প্রোডাক্ট পাওয়া যায়নি!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {currentItems.map((product) => {
                const typeLabel =
                  product.type === "account"
                    ? "অ্যাকাউন্ট"
                    : product.type === "slot"
                    ? "টিম স্লট"
                    : product.type === "license"
                    ? "লাইসেন্স কী"
                    : product.type === "course"
                    ? "কোর্স"
                    : product.type === "pdf"
                    ? "বই"
                    : product.type === "video"
                    ? "ভিডিও"
                    : product.type === "zip"
                    ? "জিপ"
                    : "ফাইল";

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
                      <figure className="relative aspect-square sm:aspect-[4/3] bg-stone-100 overflow-hidden">
                        {product.thumbnailPath ? (
                          <img
                            src={`${apiUrl}/${product.thumbnailPath}`}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                        <span className="badge bg-white/95 text-stone-800 font-bold text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md shadow-xs border border-stone-200 absolute top-2 right-2">
                          {typeLabel}
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
          )}

          {/* Dynamic pagination bar */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-10">
              <div className="join shadow-sm">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="join-item btn btn-bordered bg-base-100 font-bold"
                >
                  আগেরটি
                </button>
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(idx + 1)}
                    className={`join-item btn btn-bordered ${
                      currentPage === idx + 1 ? "btn-primary font-black" : "bg-base-100 font-bold"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="join-item btn btn-bordered bg-base-100 font-bold"
                >
                  পরেরটি
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Guest Checkout Modal Popup */}
      {selectedProduct && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl max-w-lg border border-base-300 shadow-2xl relative bg-base-100">
            <button
              onClick={() => setSelectedProduct(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content"
            >
              ✕
            </button>
            <h3 className="font-black text-xl text-base-content mb-2">গেস্ট চেকআউট</h3>
            <p className="text-xs text-base-content/70 mb-6">
              পণ্য: <span className="font-bold text-primary">{selectedProduct.title}</span>
            </p>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              {selectedProduct.checkoutFields.includes("name") && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold text-base-content/85">আপনার নাম</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="পূর্ণ নাম লিখুন"
                    className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}

              {selectedProduct.checkoutFields.includes("email") && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold text-base-content/85">ইমেইল এড্রেস</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              )}

              {selectedProduct.checkoutFields.includes("phone") && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold text-base-content/85">মোবাইল নম্বর</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="উদাঃ ০১৭xxxxxxxx"
                    className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              )}

              {/* Automated ZiniPay Hosted Checkout Notice */}
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3 mt-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-content shadow-xs shrink-0">
                  <ShieldIcon />
                </div>
                <div>
                  <div className="text-xs font-bold text-base-content">তাৎক্ষণিক ডিজিটাল পেমেন্ট</div>
                  <div className="text-[11px] text-base-content/70 font-medium">বিকাশ, নগদ, রকেট এবং কার্ডের মাধ্যমে নিরাপদ পেমেন্ট সম্পন্ন করুন</div>
                </div>
              </div>

              {/* Price payment summary */}
              <div className="flex justify-between items-center bg-base-200 p-4 rounded-2xl border border-base-300 mt-6">
                <span className="font-semibold text-sm text-base-content">পরিশোধযোগ্য টাকা:</span>
                <span className="text-2xl font-black text-primary">৳{selectedProduct.price}</span>
              </div>

              <div className="modal-action">
                <button
                  type="submit"
                  disabled={submittingCheckout}
                  className="btn btn-primary w-full rounded-xl font-bold py-3 text-base shadow-lg"
                >
                  {submittingCheckout ? "অর্ডার প্রসেস হচ্ছে..." : `পেমেন্ট সম্পন্ন করুন (৳${selectedProduct.price})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
