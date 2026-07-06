"use client";

import { useEffect, useState } from "react";
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

// Inline SVGs for Good Icons
const SearchIcon = () => (
  <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "18px", height: "18px" }}>
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

const ClockIcon = () => (
  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px", display: "inline-block" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BookOpenIcon = () => (
  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px", display: "inline-block" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5 text-amber-500 fill-amber-400" viewBox="0 0 20 20" style={{ width: "20px", height: "20px" }}>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default function StoreHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [gateway, setGateway] = useState<"bkash" | "eps">("bkash");
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  // Active banner slide
  const [activeSlide, setActiveSlide] = useState(0);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`${apiUrl}/api/products`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
          setFilteredProducts(data.products);
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

  // Handle local searching in-place
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const q = searchQuery.toLowerCase();
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

  // Featured slide products mapping
  const featuredProducts = products.filter((p) => p.price > 100).slice(0, 3);

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
      
      {/* Navbar with search bar and buttons */}
      <div className="navbar bg-base-100 shadow-md sticky top-0 z-50 px-4 md:px-8 border-b border-base-300">
        <div className="navbar-start gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-xl text-primary-content shadow-md">
              L
            </div>
            <div>
              <span className="text-lg md:text-xl font-extrabold tracking-tight text-base-content">
                লুমিনা ডিজিটাল
              </span>
              <div className="text-[10px] text-base-content/60 font-semibold mt-[-3px] block">
                ডিজিটাল বুক ও কোর্স
              </div>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="navbar-center hidden md:flex w-full max-w-md">
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
            <input
              type="text"
              placeholder="পণ্য বা কোর্স খুঁজুন..."
              className="input input-bordered w-full pr-12 focus:input-primary rounded-full bg-base-200 text-sm border-base-300 text-base-content"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-ghost btn-circle absolute right-1">
              <SearchIcon />
            </button>
          </form>
        </div>

        <div className="navbar-end gap-3">
          <a href="/shop" className="btn btn-ghost font-bold text-sm text-base-content">
            সব পণ্য
          </a>
        </div>
      </div>

      {/* Mobile search bar trigger */}
      <div className="p-4 bg-base-100 md:hidden border-b border-base-300">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
          <input
            type="text"
            placeholder="পণ্য বা কোর্স খুঁজুন..."
            className="input input-bordered w-full pr-12 focus:input-primary rounded-full text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-ghost btn-circle absolute right-1">
            <SearchIcon />
          </button>
        </form>
      </div>

      {/* Featured Products Slider Banner (Carousel style) */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4 md:px-8 mt-8">
          <div className="relative overflow-hidden rounded-3xl bg-neutral text-neutral-content p-6 md:p-12 shadow-xl border border-neutral-content/10">
            {/* Background elements decoration */}
            <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-primary/10 blur-3xl"></div>
            <div className="absolute left-10 top-0 w-60 h-60 rounded-full bg-amber-400/5 blur-3xl"></div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex-1 text-center md:text-left">
                <span className="badge badge-primary font-bold text-xs uppercase tracking-wider py-3 px-4 mb-4">
                  ফিচার্ড ডিজিটাল প্রোডাক্ট
                </span>
                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">
                  {featuredProducts[activeSlide].title}
                </h1>
                <p className="text-neutral-content/85 text-sm md:text-base max-w-xl mb-6">
                  {featuredProducts[activeSlide].description}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-8">
                  <div className="flex items-center gap-2 text-primary font-extrabold text-2xl">
                    ৳{featuredProducts[activeSlide].price}
                  </div>
                  {featuredProducts[activeSlide].compareAtPrice && (
                    <div className="text-neutral-content/40 line-through text-sm">
                      ৳{featuredProducts[activeSlide].compareAtPrice}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-center md:justify-start">
                  <button
                    onClick={() => openCheckout(featuredProducts[activeSlide])}
                    className="btn btn-primary btn-lg rounded-full font-bold shadow-lg"
                  >
                    কিনুন - এখন মাত্র ৳{featuredProducts[activeSlide].price}
                  </button>
                </div>
              </div>

              {/* Slider Image Placeholder Visual block */}
              <div className="w-full md:w-96 h-60 md:h-72 bg-base-100/5 rounded-2xl flex items-center justify-center border border-white/10 relative overflow-hidden">
                {featuredProducts[activeSlide].thumbnailPath ? (
                  <img
                    src={`${apiUrl}/${featuredProducts[activeSlide].thumbnailPath}`}
                    alt={featuredProducts[activeSlide].title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-primary">
                    <PlayIcon />
                    <span className="text-xs uppercase font-extrabold tracking-widest text-neutral-content/50">
                      ডিজিটাল প্রোডাক্ট গাইড
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Slider Switcher buttons */}
            <div className="flex justify-center md:justify-start gap-2 mt-8 relative z-10">
              {featuredProducts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`w-3 h-3 rounded-full transition-all duration-350 ${
                    idx === activeSlide ? "bg-primary w-8" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main product showcase section */}
      <main className="container mx-auto px-4 md:px-8 py-12 flex-1">
        
        {error && (
          <div className="alert alert-error shadow-md mb-8">
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* TOP LISTED PRODUCTS */}
        {filteredProducts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <span className="bg-primary/20 p-2 rounded-lg text-primary"><StarIcon /></span>
              <h2 className="text-2xl font-black text-base-content">
                আমাদের সেরা ও জনপ্রিয় প্রোডাক্টসমূহ
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {filteredProducts.slice(0, 3).map((product) => (
                <div key={product._id} className="card bg-base-100 shadow-lg border border-base-300 transition-all hover:-translate-y-2 hover:shadow-2xl">
                  <figure className="relative h-48 bg-base-200">
                    {product.thumbnailPath ? (
                      <img
                        src={`${apiUrl}/${product.thumbnailPath}`}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-primary flex flex-col items-center gap-2">
                        {product.type === "course" ? <PlayIcon /> : <DocIcon />}
                        <span className="text-xs font-bold uppercase text-stone-400">ডিজিটাল ক্যাটালগ</span>
                      </div>
                    )}
                    <span className="badge badge-primary absolute top-4 right-4 py-3 px-3 font-bold text-xs">
                      শীর্ষ পণ্য
                    </span>
                  </figure>
                  
                  <div className="card-body">
                    <h3 className="card-title text-base-content text-lg font-bold">
                      {product.title}
                    </h3>
                    <p className="text-sm text-base-content/70 line-clamp-3">
                      {product.description}
                    </p>

                    <div className="flex gap-4 text-xs text-base-content/60 my-2">
                      {product.type === "course" && product.duration && (
                        <span className="flex items-center gap-1"><ClockIcon /> {product.duration}</span>
                      )}
                      {product.type === "pdf" && product.pageCount && (
                        <span className="flex items-center gap-1"><BookOpenIcon /> {product.pageCount} পৃষ্ঠা</span>
                      )}
                    </div>

                    <div className="card-actions justify-between items-center mt-4 pt-4 border-t border-base-200">
                      <div>
                        <span className="text-2xl font-black text-primary">৳{product.price}</span>
                        {product.compareAtPrice && (
                          <span className="text-xs text-base-content/40 line-through ml-2">৳{product.compareAtPrice}</span>
                        )}
                      </div>
                      <button onClick={() => openCheckout(product)} className="btn btn-primary rounded-full btn-sm font-bold">
                        কিনুন
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ALL OTHER PRODUCTS */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-3 h-8 bg-primary rounded-full"></div>
            <h2 className="text-2xl font-black text-base-content">
              সকল প্রোডাক্ট তালিকা
            </h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="card bg-base-100 p-12 text-center border border-base-300">
              <p className="text-base-content/70 font-bold">দুঃখিত, কোনো প্রোডাক্ট পাওয়া যায়নি!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {filteredProducts.slice(3).map((product) => (
                <div key={product._id} className="card bg-base-100 shadow-md border border-base-300 hover:shadow-xl transition-all">
                  <figure className="relative h-40 bg-base-200">
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
                    <span className="badge badge-primary absolute top-3 right-3 text-[10px] font-bold py-2">
                      {product.type === "course" ? "কোর্স" : product.type === "pdf" ? "বই" : "ফাইল"}
                    </span>
                  </figure>
                  
                  <div className="card-body p-5">
                    <h3 className="card-title text-base text-base-content font-bold line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-xs text-base-content/75 line-clamp-2">
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
        </section>

        {/* Link section to full shop page */}
        <section className="mt-16">
          <div className="card bg-gradient-to-r from-primary/10 to-amber-400/5 p-8 md:p-12 text-center rounded-3xl border border-primary/20 shadow-md max-w-4xl mx-auto">
            <h2 className="text-xl md:text-3xl font-black text-base-content mb-4">
              আমাদের সকল ডিজিটাল পণ্যের লাইব্রেরি দেখতে চান?
            </h2>
            <p className="text-base-content/80 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
              বাজেট ফিল্টার, ক্যাটাগরি সাজানো এবং উন্নত সার্চ ফিচার ব্যবহার করে আপনার প্রয়োজনীয় প্রোডাক্টটি শপ পেজ থেকে খুঁজে নিন।
            </p>
            <a href="/shop" className="btn btn-primary btn-lg rounded-full font-bold shadow-lg">
              আমাদের শপ-এ প্রবেশ করুন
            </a>
          </div>
        </section>

      </main>

      {/* Guest Checkout Modal Popup */}
      {selectedProduct && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl max-w-lg border border-base-300 shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
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

              {/* Gateway switcher */}
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

              {/* Total checkout amount display */}
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
