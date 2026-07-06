"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/meta/track-event";
import { getFbCookies } from "@/lib/meta/cookies";

interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  type: "course" | "pdf" | "video" | "zip" | "other";
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

function ShopContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Checkout State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [gateway, setGateway] = useState<"bkash" | "eps">("bkash");
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
    const eventId = trackEvent("InitiateCheckout", {
      content_ids: [selectedProduct._id],
      content_type: "product",
      value: selectedProduct.price,
      currency: "BDT",
    });

    try {
      const res = await fetch(`${apiUrl}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct._id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          paymentGateway: gateway,
          metaEventId: eventId,
          fbp: fbCookies.fbp,
          fbc: fbCookies.fbc,
        }),
      });

      const data = await res.json();
      if (data.success) {
        window.location.href = `/receipt/${data.order.orderId}`;
      } else {
        alert(data.message || "চেকআউট প্রসেস ব্যর্থ হয়েছে");
      }
    } catch (err) {
      alert("নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।");
    } finally {
      setSubmittingCheckout(false);
    }
  };

  // Filter Logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch = searchQuery.trim()
      ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesCategory =
      selectedCategory === "all" ? true : p.type === selectedCategory;

    const matchesPrice = p.price <= maxPrice;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <span className="text-primary font-bold">লোডিং হচ্ছে...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-base-200" data-theme="lightyellow">
      {/* Navbar header without admin panel button */}
      <div className="navbar bg-base-100 shadow-md sticky top-0 z-50 px-4 md:px-8 border-b border-base-300">
        <div className="navbar-start gap-2">
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-xl text-primary-content shadow-md">
              L
            </div>
            <div>
              <span className="text-lg md:text-xl font-extrabold tracking-tight text-base-content">
                লুমিনা ডিজিটাল শপ
              </span>
            </div>
          </a>
        </div>

        <div className="navbar-end gap-3">
          <a href="/" className="btn btn-ghost font-extrabold text-sm text-base-content">
            হোমপেজ
          </a>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-8 py-10 flex-1">
        {error && (
          <div className="alert alert-error shadow-md mb-8">
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Unified Top Inline Filter Layout */}
        <div className="card bg-base-100 p-6 rounded-3xl border border-base-300 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            
            {/* Search Input and Horizontal Category Scrollbar */}
            <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full">
              {/* Search input field */}
              <div className="relative w-full md:w-80">
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
              <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin max-w-full">
                {[
                  { key: "all", label: "সব ক্যাটাগরি" },
                  { key: "course", label: "ভিডিও কোর্স" },
                  { key: "pdf", label: "পিডিএফ বই" },
                  { key: "video", label: "ভিডিও গাইড" },
                  { key: "zip", label: "জিপ ফাইল" },
                  { key: "other", label: "অন্যান্য ফাইল" }
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

            {/* Price budget slider container */}
            <div className="w-full lg:w-64 flex flex-col gap-1 border-t lg:border-t-0 lg:border-l border-base-300 pt-4 lg:pt-0 lg:pl-6">
              <div className="flex justify-between text-xs font-bold text-base-content/80">
                <span>সর্বোচ্চ বাজেট</span>
                <span className="text-primary font-black">৳{maxPrice}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                className="range range-primary range-xs"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(Number(e.target.value));
                  setCurrentPage(1);
                }}
              />
              <div className="flex justify-between text-[9px] text-base-content/40 font-bold px-1">
                <span>৳০</span>
                <span>৳৫,০০০</span>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentItems.map((product) => (
                <div key={product._id} className="card bg-base-100 shadow-md border border-base-300 hover:shadow-xl transition-all">
                  <figure className="relative h-44 bg-base-200">
                    {product.thumbnailPath ? (
                      <img
                        src={`${apiUrl}/${product.thumbnailPath}`}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-primary flex flex-col items-center gap-2">
                        {product.type === "course" ? <PlayIcon /> : <DocIcon />}
                      </div>
                    )}
                    <span className="badge badge-primary absolute top-3 right-3 text-[10px] font-bold py-2 px-3">
                      {product.type === "course" ? "কোর্স" : product.type === "pdf" ? "বই" : "ফাইল"}
                    </span>
                  </figure>

                  <div className="card-body p-5">
                    <h3 className="card-title text-base-content text-base font-black line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-xs text-base-content/70 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="card-actions justify-between items-center mt-3 pt-3 border-t border-base-200">
                      <span className="text-lg font-black text-primary">৳{product.price}</span>
                      <button onClick={() => openCheckout(product)} className="btn btn-primary rounded-full btn-xs px-3 font-bold">
                        কিনুন
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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

              {/* Gateway Selection */}
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text font-bold text-base-content/85">পেমেন্ট পদ্ধতি নির্বাচন করুন</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label
                    className={`border-2 rounded-2xl p-5 cursor-pointer flex flex-col items-center gap-2 transition-all ${
                      gateway === "bkash" ? "border-rose-500 bg-rose-500/5 shadow-md" : "border-base-300 bg-base-100 shadow-none hover:border-base-450"
                    }`}
                    onClick={() => setGateway("bkash")}
                  >
                    <input
                      type="radio"
                      name="gateway"
                      checked={gateway === "bkash"}
                      readOnly
                      className="radio radio-primary radio-sm accent-rose-600"
                    />
                    <div className="font-extrabold text-rose-600 text-sm">বিকাশ পার্সোনাল</div>
                    <div className="text-[10px] text-base-content/60 font-semibold">ম্যানুয়াল ভেরিফিকেশন</div>
                  </label>

                  <label
                    className={`border-2 rounded-2xl p-5 cursor-pointer flex flex-col items-center gap-2 transition-all ${
                      gateway === "eps" ? "border-primary bg-primary/5 shadow-md" : "border-base-300 bg-base-100 shadow-none hover:border-base-450"
                    }`}
                    onClick={() => setGateway("eps")}
                  >
                    <input
                      type="radio"
                      name="gateway"
                      checked={gateway === "eps"}
                      readOnly
                      className="radio radio-primary radio-sm"
                    />
                    <div className="font-extrabold text-primary text-sm">ইপিএস গেটওয়ে</div>
                    <div className="text-[10px] text-base-content/60 font-semibold font-sans">অটোমেটিক ক্লিয়ারিং</div>
                  </label>
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

      {/* Footer info block */}
      <footer className="footer footer-center p-10 bg-neutral text-neutral-content border-t border-neutral-content/10">
        <aside>
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-black text-2xl text-primary-content mb-4 shadow-lg">
            L
          </div>
          <p className="font-bold text-white text-lg">
            লুমিনা ডিজিটাল স্টোরফ্রন্ট
          </p>
          <p className="text-neutral-content/65 text-xs">
            সুরক্ষিত পেমেন্ট এবং তাত্ক্ষণিক ডাউনলোডের ডিজিটাল হাব।
          </p>
          <p className="text-neutral-content/40 text-xs mt-4">
            &copy; ২০২৬ লুমিনা ডিজিটাল। সর্বস্বত্ব সংরক্ষিত।
          </p>
        </aside>
      </footer>
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
