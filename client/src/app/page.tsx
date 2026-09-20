"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/meta/track-event";
import { getFbCookies } from "@/lib/meta/cookies";
import Footer from "@/components/Footer";
import { BrandIcon, BRAND_SERVICES } from "@/components/BrandLogos";

interface Promotion {
  type: string;
  minQty: number;
  percent: number;
  bonusQty?: number;
}

interface PurchaseRequirements {
  customerEmail?: boolean;
  slotMonths?: boolean;
  quantityFixed?: number;
  allowedMonths?: number[];
}

interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  type: "account" | "slot" | "license" | "course" | "pdf" | "video" | "zip" | "other";
  serviceTag?: string;
  category?: string;
  thumbnailPath?: string;
  duration?: string;
  pageCount?: number;
  version?: string;
  autoFulfill?: boolean;
  upstreamProductId?: string;
  purchaseRequirements?: PurchaseRequirements;
  availability?: {
    available: number;
    sold: number;
  };
  promotions?: Promotion[];
  checkoutFields: string[];
  isWebDisplay: boolean;
  curriculum?: { title: string; duration?: string }[];
}

// Search & Status Icons
const SearchIcon = () => (
  <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const BoltIcon = () => (
  <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const UserGroupIcon = () => (
  <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

function StorefrontContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") || "";
  const initialCategory = searchParams?.get("category") || "all";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedServiceTag, setSelectedServiceTag] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Checkout Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    customerEmail: "",
  });
  const [selectedSlotMonth, setSelectedSlotMonth] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(1);
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`${apiUrl}/api/products`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.products || []);
        } else {
          setError(data.message || "পণ্য লোড করতে ব্যর্থ হয়েছে।");
        }
      } catch {
        setError("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [apiUrl]);

  // Categories list with counts
  const categories = useMemo(() => {
    const counts: Record<string, number> = {
      all: products.length,
      ai: 0,
      creative: 0,
      dev: 0,
      streaming: 0,
      vpn: 0,
      slot: 0,
      account: 0,
    };

    products.forEach((p) => {
      if (p.category && counts[p.category] !== undefined) {
        counts[p.category]++;
      }
      if (p.type === "slot") counts.slot++;
      if (p.type === "account") counts.account++;
    });

    return [
      { key: "all", label: "সব প্রোডাক্ট", count: counts.all },
      { key: "ai", label: "AI ও চ্যাটবট", count: counts.ai },
      { key: "creative", label: "ডিজাইন ও ভিডিও AI", count: counts.creative },
      { key: "dev", label: "ডেভেলপার টুলস", count: counts.dev },
      { key: "streaming", label: "স্ট্রিমিং ও বিনোদন", count: counts.streaming },
      { key: "vpn", label: "VPN ও সিকিউরিটি", count: counts.vpn },
      { key: "slot", label: "টিম স্লট / ইনভাইট", count: counts.slot },
      { key: "account", label: "প্রাইভেট অ্যাকাউন্ট", count: counts.account },
    ];
  }, [products]);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = q
        ? p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.serviceTag && p.serviceTag.toLowerCase().includes(q))
        : true;

      const matchesCategory =
        selectedCategory === "all"
          ? true
          : selectedCategory === "slot"
          ? p.type === "slot"
          : selectedCategory === "account"
          ? p.type === "account"
          : p.category === selectedCategory;

      const matchesService = selectedServiceTag
        ? p.serviceTag === selectedServiceTag ||
          p.title.toLowerCase().includes(selectedServiceTag.toLowerCase())
        : true;

      return matchesSearch && matchesCategory && matchesService;
    });
  }, [products, searchQuery, selectedCategory, selectedServiceTag]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleCategorySelect = (key: string) => {
    setSelectedCategory(key);
    setSelectedServiceTag("");
    setCurrentPage(1);
  };

  const handleBrandSelect = (tag: string) => {
    setSelectedServiceTag(tag === selectedServiceTag ? "" : tag);
    setCurrentPage(1);
    if (tag) {
      trackEvent("Search", { search_string: tag });
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    if (val.trim()) {
      trackEvent("Search", { search_string: val.trim() });
    }
  };

  // Open Checkout Modal
  const openCheckout = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    const defaultMonth = product.purchaseRequirements?.allowedMonths?.[0] || 1;
    setSelectedSlotMonth(defaultMonth);

    trackEvent("ViewContent", {
      content_ids: [product._id],
      content_name: product.title,
      content_type: "product",
      value: product.price,
      currency: "BDT",
    });
  };

  // Compute checkout price
  const computedPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    let base = selectedProduct.price;

    if (
      selectedProduct.purchaseRequirements?.slotMonths &&
      selectedSlotMonth &&
      selectedProduct.purchaseRequirements.allowedMonths?.length
    ) {
      const firstAllowed = selectedProduct.purchaseRequirements.allowedMonths[0] || 1;
      base = Math.round(selectedProduct.price * (selectedSlotMonth / firstAllowed));
    }

    let total = base * quantity;

    // Check promotions / bulk discounts
    if (selectedProduct.promotions && selectedProduct.promotions.length > 0) {
      for (const promo of selectedProduct.promotions) {
        if (quantity >= promo.minQty) {
          const discount = (total * promo.percent) / 100;
          total = Math.round(total - discount);
          break;
        }
      }
    }

    return total;
  }, [selectedProduct, selectedSlotMonth, quantity]);

  // Handle Checkout Submit
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
        value: computedPrice,
        currency: "BDT",
        num_items: quantity,
      },
      {
        email: formData.email || formData.customerEmail,
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
          email: formData.email || formData.customerEmail,
          phone: formData.phone,
          customerEmail: formData.customerEmail || formData.email,
          slotMonths: selectedProduct.purchaseRequirements?.slotMonths
            ? selectedSlotMonth
            : undefined,
          quantity,
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
        alert(data.message || "চেকআউট প্রক্রিয়া সম্পন্ন করা যায়নি।");
      }
    } catch {
      alert("নেটওয়ার্ক সমস্যা। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setSubmittingCheckout(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "slot":
        return {
          label: "টিম স্লট / ইনভাইট",
          badgeClass: "badge-secondary",
          icon: <UserGroupIcon />,
          desc: "আপনার নিজস্ব ইমেইলে ইনভাইটেশন পাঠানো হবে",
        };
      case "license":
        return {
          label: "লাইসেন্স কি",
          badgeClass: "badge-accent",
          icon: <KeyIcon />,
          desc: "অ্যাক্টিভেশন লাইসেন্স কি",
        };
      case "account":
      default:
        return {
          label: "ইনস্ট্যান্ট অ্যাকাউন্ট",
          badgeClass: "badge-primary",
          icon: <BoltIcon />,
          desc: "স্বয়ংক্রিয় ইনস্ট্যান্ট লগইন ডেলিভারি",
        };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-primary selection:text-white">
      {/* Top Banner Navigation */}
      <header className="navbar bg-[#0b1120]/95 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 border-b border-slate-800 shadow-md">
        <div className="navbar-start gap-3">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black text-lg tracking-wider shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              KB
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white">
                  KaloBazar
                </span>
                <span className="badge badge-primary badge-xs font-bold text-[9px] uppercase px-1.5 py-0.5 shadow-sm">
                  Auto API
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold mt-[-2px]">
                ডিজিটাল সাবস্ক্রিপশন ও অ্যাকাউন্ট
              </div>
            </div>
          </a>
        </div>

        {/* Center Search Bar */}
        <div className="navbar-center hidden md:flex w-full max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="ChatGPT, Claude, Canva, Netflix বা VPN খুঁজুন..."
              className="input input-bordered w-full pl-10 pr-8 rounded-xl bg-slate-900/90 text-sm border-slate-700 text-white focus:border-cyan-400 focus:outline-none placeholder:text-slate-500"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <SearchIcon />
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="btn btn-ghost btn-xs btn-circle absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="navbar-end gap-3">
          <a
            href="#catalog"
            className="btn btn-primary btn-sm rounded-xl font-bold shadow-md shadow-primary/20"
          >
            মার্কেটপ্লেস দেখুন
          </a>
        </div>
      </header>

      {/* Mobile Search Bar */}
      <div className="p-3 bg-[#0b1120] md:hidden border-b border-slate-800">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="ChatGPT, Claude, Canva খুঁজুন..."
            className="input input-bordered w-full pl-10 pr-8 rounded-xl text-sm bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <SearchIcon />
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="btn btn-ghost btn-xs btn-circle absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0b1120] via-[#0d1527] to-[#090d16] border-b border-slate-800/80 py-10 md:py-14 px-4 md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/15 via-transparent to-transparent pointer-events-none"></div>

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-xs font-bold text-cyan-400 mb-4 shadow-sm">
            <BoltIcon /> Telegram Buyer API v2.1.0 অটোমেটেড ডেলিভারি
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
            প্রিমিয়াম ডিজিটাল অ্যাকাউন্ট ও সাবস্ক্রিপশন হাব
          </h1>

          <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto mb-6 font-medium leading-relaxed">
            ChatGPT Plus, Claude 3.5, Canva Pro, Cursor, Netflix, Adobe CC এবং VPN
            সাবস্ক্রিপশন সংগ্রহ করুন ১০০% নিরাপদ পেমেন্টে এবং তাৎক্ষণিক স্বয়ংক্রিয় ডেলিভারিতে।
          </p>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto pt-2">
            <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-bold text-slate-200">
              <BoltIcon /> তাৎক্ষণিক স্ক্রিন ও ইমেইল ডেলিভারি
            </div>
            <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-bold text-slate-200">
              <ShieldCheckIcon /> সম্পূর্ণ প্রাইভেট ও ফুল ওয়ারেন্টি
            </div>
            <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-bold text-slate-200">
              <CheckCircleIcon /> বিকাশ, নগদ ও কার্ডে অটো পেমেন্ট
            </div>
          </div>
        </div>
      </section>

      {/* Brand & Service Tag Pills Selector Strip (Matching user screenshot) */}
      <section className="bg-[#0b1222] border-b border-slate-800/90 py-5 px-4 md:px-8 sticky top-[65px] z-30 shadow-md">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              ব্র্যান্ড / সার্ভিস নির্বাচন করুন
            </span>
            {selectedServiceTag && (
              <button
                onClick={() => setSelectedServiceTag("")}
                className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
              >
                ফিল্টার মুছুন ✕
              </button>
            )}
          </div>

          {/* Service Pills Carousel / Multi-Row Wrapper */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
            {BRAND_SERVICES.map((brand) => {
              const isSelected =
                brand.id === "all"
                  ? selectedServiceTag === ""
                  : selectedServiceTag === brand.tag;

              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() =>
                    brand.id === "all"
                      ? setSelectedServiceTag("")
                      : handleBrandSelect(brand.tag)
                  }
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all duration-150 cursor-pointer border ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-md shadow-cyan-500/10 scale-105"
                      : "bg-[#161f32] text-slate-200 border-slate-700/80 hover:bg-[#1f2c45] hover:border-slate-600"
                  }`}
                >
                  <span className="shrink-0 flex items-center justify-center">
                    <BrandIcon name={brand.id} className="w-4 h-4" />
                  </span>
                  <span>{brand.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <main id="catalog" className="container mx-auto px-4 md:px-8 py-10 flex-1 max-w-7xl">
        {error && (
          <div className="alert alert-error shadow-sm mb-8 rounded-2xl bg-red-950/60 border border-red-800 text-red-200">
            <span className="font-semibold text-sm">{error}</span>
          </div>
        )}

        {/* Category Tabs & Status Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-[#0e1628] p-4 md:p-5 rounded-2xl border border-slate-800 shadow-sm">
          {/* Scrollable Categories List */}
          <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin max-w-full w-full md:w-auto">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCategorySelect(cat.key)}
                  className={`btn btn-sm rounded-xl font-bold whitespace-nowrap transition-all gap-1.5 ${
                    isActive
                      ? "btn-primary shadow-sm"
                      : "btn-ghost text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {cat.label}
                  <span
                    className={`badge badge-xs px-1.5 py-0.5 rounded-md font-bold ${
                      isActive
                        ? "badge-neutral text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Results Counter */}
          <div className="text-xs font-bold text-slate-400 shrink-0 self-end md:self-center">
            পাওয়া গেছে:{" "}
            <span className="text-white font-black">{filteredProducts.length}টি</span>{" "}
            সার্ভিস
          </div>
        </div>

        {/* Skeleton Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-[#0e1628] border border-slate-800 rounded-2xl p-5 space-y-4 animate-pulse"
              >
                <div className="h-36 bg-slate-800/60 rounded-xl"></div>
                <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                <div className="h-3 bg-slate-800 rounded w-full"></div>
                <div className="h-3 bg-slate-800 rounded w-2/3"></div>
                <div className="h-10 bg-slate-800 rounded-xl mt-4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && currentItems.length === 0 && (
          <div className="bg-[#0e1628] border border-slate-800 shadow-md rounded-3xl p-12 md:p-16 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <SearchIcon />
            </div>
            <h3 className="text-lg font-black text-white mb-2">
              কোনো সাবস্ক্রিপশন প্রোডাক্ট পাওয়া যায়নি
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              আপনার অনুসন্ধান{" "}
              <span className="font-bold text-white">
                "{searchQuery || selectedServiceTag}"
              </span>{" "}
              অনুযায়ী কোনো প্যাকেজ মেলেনি।
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedServiceTag("");
                setCurrentPage(1);
              }}
              className="btn btn-outline btn-sm rounded-xl font-bold border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              সব ফিল্টার রিসেট করুন
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!loading && currentItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentItems.map((product) => {
              const typeInfo = getTypeBadge(product.type);
              const discountPct =
                product.compareAtPrice && product.compareAtPrice > product.price
                  ? Math.round(
                      ((product.compareAtPrice - product.price) /
                        product.compareAtPrice) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={product._id}
                  className="bg-[#0e1628] border border-slate-800 hover:border-cyan-500/50 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-200 rounded-2xl overflow-hidden flex flex-col group relative"
                >
                  {/* Top Badge Strip & Icon */}
                  <div className="p-5 pb-3 border-b border-slate-800/80 bg-gradient-to-b from-[#131d33] to-[#0e1628]">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {/* Product Brand Icon */}
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
                        <BrandIcon
                          name={product.serviceTag || product.title}
                          className="w-5 h-5"
                        />
                      </div>

                      {/* Stock / Auto Delivery Pill */}
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        ইনস্ট্যান্ট অটো
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span
                        className={`badge ${typeInfo.badgeClass} badge-xs font-bold text-[10px] py-2 px-2 gap-1 rounded-md`}
                      >
                        {typeInfo.icon}
                        {typeInfo.label}
                      </span>
                      {product.duration && (
                        <span className="badge bg-slate-800 border-slate-700 text-slate-300 badge-xs font-semibold text-[10px] py-2 px-2 rounded-md">
                          {product.duration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="text-base font-black text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed font-normal">
                        {product.description}
                      </p>

                      {/* Bulk Promotion Tag if available */}
                      {product.promotions && product.promotions.length > 0 && (
                        <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 flex items-center gap-2 text-[11px] text-amber-300 font-bold">
                          <span>🎁</span>
                          <span>
                            {product.promotions[0].minQty}+ কিনলে{" "}
                            {product.promotions[0].percent}% ছাড়
                            {product.promotions[0].bonusQty ? " + ১টি ফ্রি" : ""}
                          </span>
                        </div>
                      )}

                      {/* Service features checklist */}
                      <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <CheckCircleIcon />
                          <span>১০০% ওয়ারেন্টি ও প্রাইভেট অ্যাক্সেস</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircleIcon />
                          <span>
                            {product.type === "slot"
                              ? "পার্সোনাল ইমেইলে ইনভাইটেশন পাঠানো হয়"
                              : "পেমেন্টের পরই স্ক্রিনে লগইন দেখা যাবে"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Checkout Action */}
                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-lg font-black text-white">
                          ৳{product.price}
                        </div>
                        {product.compareAtPrice &&
                          product.compareAtPrice > product.price && (
                            <div className="text-[11px] text-slate-500 line-through font-semibold flex items-center gap-1">
                              <span>৳{product.compareAtPrice}</span>
                              <span className="text-emerald-400 font-bold">
                                -{discountPct}%
                              </span>
                            </div>
                          )}
                      </div>

                      <button
                        onClick={() => openCheckout(product)}
                        className="btn btn-primary btn-sm rounded-xl font-bold px-4 shadow-sm hover:shadow-cyan-500/20 transition-all cursor-pointer"
                      >
                        কিনুন →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="join shadow-sm border border-slate-800 rounded-xl overflow-hidden bg-[#0e1628]">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="join-item btn btn-sm bg-[#0e1628] text-slate-300 font-bold border-r border-slate-800"
              >
                ← আগেরটি
              </button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`join-item btn btn-sm border-r border-slate-800 ${
                    currentPage === idx + 1
                      ? "btn-primary font-black"
                      : "bg-[#0e1628] text-slate-300 font-bold"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="join-item btn btn-sm bg-[#0e1628] text-slate-300 font-bold"
              >
                পরেরটি →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Guest Checkout Modal Popup */}
      {selectedProduct && (
        <div className="modal modal-open bg-black/75 backdrop-blur-sm z-50">
          <div className="modal-box rounded-3xl max-w-lg border border-slate-700 bg-[#0d1527] p-6 sm:p-8 text-slate-100 shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setSelectedProduct(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
                <BrandIcon
                  name={selectedProduct.serviceTag || selectedProduct.title}
                  className="w-4 h-4"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  {selectedProduct.type === "slot"
                    ? "ওয়ার্কস্পেস টিম স্লট"
                    : "ইনস্ট্যান্ট প্রাইভেট অ্যাকাউন্ট"}
                </span>
                <h3 className="font-black text-lg text-white leading-tight">
                  {selectedProduct.title}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-5">
              অর্ডার সম্পন্ন করার জন্য নিচের তথ্য পূরণ করুন। পেমেন্টের সাথে সাথে অ্যাক্টিভেশন
              প্রক্রিয়া শুরু হবে।
            </p>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              {/* If Slot product or requires customer email */}
              {(selectedProduct.type === "slot" ||
                selectedProduct.purchaseRequirements?.customerEmail) && (
                <div className="form-control bg-cyan-950/30 border border-cyan-500/30 rounded-2xl p-3.5">
                  <label className="label py-0 mb-1">
                    <span className="label-text font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                      <UserGroupIcon /> আপনার ব্যক্তিগত ইমেইল এড্রেস *
                    </span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com (এই ইমেইলে ইনভাইট পাঠানো হবে)"
                    className="input input-bordered w-full rounded-xl text-sm bg-slate-900 border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                    value={formData.customerEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, customerEmail: e.target.value })
                    }
                  />
                  <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    যে ইমেইল একাউন্টে আপনি সাবস্ক্রিপশনটি সক্রিয় করতে চান তা লিখুন।
                  </div>
                </div>
              )}

              {/* Slot Months selector if allowedMonths present */}
              {selectedProduct.purchaseRequirements?.slotMonths &&
                selectedProduct.purchaseRequirements?.allowedMonths &&
                selectedProduct.purchaseRequirements.allowedMonths.length > 0 && (
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs text-slate-300">
                        সাবস্ক্রিপশনের মেয়াদ নির্বাচন করুন:
                      </span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProduct.purchaseRequirements.allowedMonths.map(
                        (m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSelectedSlotMonth(m)}
                            className={`btn btn-sm rounded-xl font-bold ${
                              selectedSlotMonth === m
                                ? "btn-primary shadow-sm"
                                : "btn-outline border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            {m} মাস
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Quantity selector for non-slot products */}
              {selectedProduct.type !== "slot" &&
                !selectedProduct.purchaseRequirements?.quantityFixed && (
                  <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-300">
                      অ্যাকাউন্টের সংখ্যা (Quantity):
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="btn btn-xs btn-circle btn-outline border-slate-700 text-white"
                      >
                        -
                      </button>
                      <span className="font-black text-sm text-white w-5 text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="btn btn-xs btn-circle btn-outline border-slate-700 text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

              {/* Customer Name */}
              {selectedProduct.checkoutFields?.includes("name") && (
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-slate-300">
                      আপনার নাম *
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="আপনার পূর্ণ নাম লিখুন"
                    className="input input-bordered rounded-xl text-sm bg-slate-900 border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              )}

              {/* Standard Email (if not slot) */}
              {selectedProduct.checkoutFields?.includes("email") &&
                selectedProduct.type !== "slot" &&
                !selectedProduct.purchaseRequirements?.customerEmail && (
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs text-slate-300">
                        ইমেইল এড্রেস (ইনভয়েস ও রিসিট পেতে) *
                      </span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      className="input input-bordered rounded-xl text-sm bg-slate-900 border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                )}

              {/* Phone Number */}
              {selectedProduct.checkoutFields?.includes("phone") && (
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-slate-300">
                      মোবাইল নম্বর (SMS কনফার্মেশনের জন্য) *
                    </span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="017xxxxxxxx"
                    className="input input-bordered rounded-xl text-sm bg-slate-900 border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              )}

              {/* Instant Delivery Assurance Note */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <BoltIcon />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    তাৎক্ষণিক স্বয়ংক্রিয় প্রসেসিং
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    পেমেন্ট সফল হওয়ার সাথে সাথে স্ক্রিনে লগইন ক্রেডেনশিয়াল প্রদর্শিত
                    হবে।
                  </div>
                </div>
              </div>

              {/* Total checkout amount display */}
              <div className="flex justify-between items-center bg-[#090d16] p-4 rounded-2xl border border-slate-800 mt-4">
                <span className="font-bold text-sm text-slate-300">
                  পরিশোধযোগ্য সর্বমোট:
                </span>
                <span className="text-2xl font-black text-cyan-400">
                  ৳{computedPrice}
                </span>
              </div>

              <div className="modal-action mt-5">
                <button
                  type="submit"
                  disabled={submittingCheckout}
                  className="btn btn-primary w-full rounded-xl font-bold py-3 text-sm shadow-md cursor-pointer"
                >
                  {submittingCheckout ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      অর্ডার প্রসেস হচ্ছে...
                    </>
                  ) : (
                    `পেমেন্ট সম্পন্ন করুন (৳${computedPrice}) →`
                  )}
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

export default function StoreHome() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#090d16]">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }
    >
      <StorefrontContent />
    </Suspense>
  );
}
