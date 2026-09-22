"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useModal } from "@/context/ModalContext";
import { getApiUrl } from "@/lib/api";
import FormattedDescription from "@/components/FormattedDescription";
import {
  Server,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Package,
  Layers,
  Upload,
  Link as LinkIcon,
  Zap,
  Tag,
  Sliders,
  Sparkles,
  Wallet,
  ArrowRight,
  TrendingUp,
  X,
} from "lucide-react";

interface UpstreamProduct {
  id: string | number;
  productId?: string;
  name: string;
  code?: string;
  costUsd: number;
  costVnd?: number;
  stock: number;
  type?: string;
  category?: string;
  description?: string;
  image?: string;
  price?: {
    amountUsd?: number;
    amount?: number;
    currency?: string;
    calculatedBdt?: number;
  };
  availability?: {
    available?: number;
    sold?: number;
  };
  requirements?: {
    hasUser?: boolean;
    hasPassword?: boolean;
    hasEmail?: boolean;
    hasWorkspace?: boolean;
  };
}

interface StoreCategory {
  _id: string;
  name: string;
  slug: string;
}

interface StoreProduct {
  _id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  canbosoProductId?: string;
  canbosoCostUsd?: number;
  active: boolean;
}

export default function CanbosoStockPage() {
  const { showAlert } = useModal();
  const [mounted, setMounted] = useState(false);
  const [upstreamProducts, setUpstreamProducts] = useState<UpstreamProduct[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [dollarRate, setDollarRate] = useState<number>(127);
  const [balance, setBalance] = useState<{ balanceUsd: number; balanceVnd: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "connected" | "not_connected">("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Import Modal State
  const [selectedProduct, setSelectedProduct] = useState<UpstreamProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingImport, setSubmittingImport] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // AI Copywriting State
  const [generatingAiCopy, setGeneratingAiCopy] = useState(false);
  const [descTab, setDescTab] = useState<"edit" | "preview">("edit");
  const [aiSuccessMessage, setAiSuccessMessage] = useState("");
  const [aiErrorMessage, setAiErrorMessage] = useState("");

  // Keyboard shortcut to close modal
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Modal Form Fields
  const [importForm, setImportForm] = useState({
    title: "",
    slug: "",
    category: "",
    priceBdt: 0,
    comparePriceBdt: 0,
    description: "",
    image: "",
    isFeatured: false,
    isSlider: false,
    autoFulfill: true,
  });

  const apiUrl = getApiUrl();

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [upstreamRes, storeProdsRes, catsRes, balanceRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/canboso/products`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}/api/admin/products`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}/api/admin/categories`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}/api/admin/canboso/balance`, { headers: getAuthHeaders() }),
      ]);

      const upstreamData = await upstreamRes.json();
      if (upstreamData.success) {
        const rawList = Array.isArray(upstreamData.products) ? upstreamData.products : [];
        const normalized: UpstreamProduct[] = rawList.map((p: any) => {
          const costUsd = Number(p.costUsd ?? p.price?.amountUsd ?? 0);
          const costVnd = Number(p.costVnd ?? p.price?.amount ?? 0);
          const stock = Number(p.stock ?? p.availability?.available ?? 0);
          const id = String(p.id ?? p.productId ?? "");
          return {
            ...p,
            id,
            productId: id,
            name: p.name || "Canboso Product",
            code: p.code || "",
            costUsd,
            costVnd,
            stock,
            type: p.type || p.productType || "account",
            description: p.description || "",
            image: p.image || "",
          };
        });
        setUpstreamProducts(normalized);
        if (upstreamData.dollarRate) {
          setDollarRate(upstreamData.dollarRate);
        }
      }

      const storeProdsData = await storeProdsRes.json();
      if (storeProdsData.success) {
        setStoreProducts(storeProdsData.products || []);
      }

      const catsData = await catsRes.json();
      if (catsData.success && Array.isArray(catsData.categories)) {
        setCategories(catsData.categories);
      }

      const balanceData = await balanceRes.json();
      if (balanceData.success) {
        setBalance({ balanceUsd: Number(balanceData.balanceUsd || 0), balanceVnd: Number(balanceData.balanceVnd || 0) });
      }
    } catch (err) {
      console.error("Error loading Canboso data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiUrl]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleGenerateAiCopy = async (customProduct?: UpstreamProduct) => {
    const prod = customProduct || selectedProduct;
    if (!prod) return;

    setGeneratingAiCopy(true);
    setAiSuccessMessage("");
    setAiErrorMessage("");

    try {
      const res = await fetch(`${apiUrl}/api/admin/ai/generate-copy`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: prod.name,
          description: prod.description || importForm.description,
          code: prod.code,
          type: prod.type,
          category: importForm.category,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setImportForm((prev) => ({
          ...prev,
          title: data.title || prev.title,
          slug: data.slug || prev.slug,
          description: data.description || prev.description,
        }));
        setDescTab("preview");
        setAiSuccessMessage(`✓ AI সফলভাবে বাংলায় মার্কেটিং টাইটেল ও ডেসক্রিপশন তৈরি করেছে (${data.modelUsed})`);
      } else {
        const errorMsg = data.message || "AI copy generation failed.";
        setAiErrorMessage(errorMsg);
        if (errorMsg.toLowerCase().includes("not configured") || errorMsg.toLowerCase().includes("missing")) {
          await showAlert({
            title: "AI Configuration Required",
            message: "OpenRouter API Key is not configured yet. Please enter your OpenRouter token in Admin Settings > OpenRouter AI.",
            type: "warning",
          });
        }
      }
    } catch (err: any) {
      setAiErrorMessage(err.message || "Network error while contacting AI service.");
    } finally {
      setGeneratingAiCopy(false);
    }
  };

  const openImportModal = (product: UpstreamProduct) => {
    setSelectedProduct(product);
    setAiSuccessMessage("");
    setAiErrorMessage("");

    // Check if already connected to a storefront product
    const existing = storeProducts.find((p) => p.canbosoProductId === String(product.id || product.productId));

    // Default price estimation: cost USD * dollar rate * 1.35 (35% default margin), rounded up to nearest 10
    const costUsd = Number(product.costUsd ?? (product as any).price?.amountUsd ?? 0);
    const estimatedCostBdt = costUsd * dollarRate;
    const defaultPriceBdt = Math.ceil((estimatedCostBdt * 1.35) / 10) * 10;
    const defaultCompareBdt = Math.ceil((defaultPriceBdt * 1.25) / 10) * 10;

    setImportForm({
      title: existing ? existing.title : product.name,
      slug: existing ? existing.slug : generateSlug(product.name),
      category: categories[0]?.name || "",
      priceBdt: existing ? existing.price : defaultPriceBdt,
      comparePriceBdt: existing?.compareAtPrice || defaultCompareBdt,
      description: product.description || `Official digital subscription and license for ${product.name}. Instant automated activation and access delivered immediately upon payment.`,
      image: "",
      isFeatured: false,
      isSlider: false,
      autoFulfill: true,
    });

    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "thumbnail");

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${apiUrl}/api/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.filePath) {
        setImportForm((prev) => ({ ...prev, image: data.filePath }));
      } else {
        await showAlert({
          title: "Upload Failed",
          message: data.message || "Image upload failed. Please choose another file.",
          type: "error",
        });
      }
    } catch (err) {
      await showAlert({
        title: "Upload Error",
        message: "Error uploading image. Please check network connection.",
        type: "error",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!importForm.title.trim()) {
      await showAlert({
        title: "Validation Error",
        message: "Please specify a storefront product title.",
        type: "warning",
      });
      return;
    }

    if (importForm.priceBdt <= 0) {
      await showAlert({
        title: "Validation Error",
        message: "Please provide a valid selling price in BDT (greater than 0).",
        type: "warning",
      });
      return;
    }

    setSubmittingImport(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/canboso/import`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          canbosoProductId: selectedProduct.id,
          title: importForm.title.trim(),
          slug: importForm.slug.trim() || generateSlug(importForm.title),
          description: importForm.description,
          price: Number(importForm.priceBdt),
          comparePrice: Number(importForm.comparePriceBdt) || undefined,
          compareAtPrice: Number(importForm.comparePriceBdt) || undefined,
          category: importForm.category,
          image: importForm.image || undefined,
          thumbnailPath: importForm.image || undefined,
          isFeatured: importForm.isFeatured,
          isSlider: importForm.isSlider,
          showInSlider: importForm.isSlider,
          autoFulfill: importForm.autoFulfill,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        await showAlert({
          title: "Product Connected",
          message: data.message || "Product connected to store catalog successfully!",
          type: "success",
        });
        loadData(true);
      } else {
        await showAlert({
          title: "Import Failed",
          message: data.message || "Failed to import product.",
          type: "error",
        });
      }
    } catch (err) {
      await showAlert({
        title: "Network Error",
        message: "Network error processing product import.",
        type: "error",
      });
    } finally {
      setSubmittingImport(false);
    }
  };

  // Filtered Upstream Products
  const filteredProducts = upstreamProducts.filter((p) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchId = String(p.id).includes(q);
      if (!matchName && !matchId) return false;
    }

    // Stock Filter
    if (stockFilter === "in_stock" && p.stock <= 0) return false;
    if (stockFilter === "out_of_stock" && p.stock > 0) return false;

    // Connection Status Filter
    const isConnected = storeProducts.some((sp) => sp.canbosoProductId === String(p.id));
    if (statusFilter === "connected" && !isConnected) return false;
    if (statusFilter === "not_connected" && isConnected) return false;

    return true;
  });

  // Calculate live financial profit for modal
  const modalSellingPriceUsd = importForm.priceBdt > 0 ? importForm.priceBdt / dollarRate : 0;
  const modalCostUsd = Number(selectedProduct?.costUsd ?? (selectedProduct as any)?.price?.amountUsd ?? 0);
  const modalProfitUsd = modalSellingPriceUsd - modalCostUsd;
  const modalProfitBdt = Math.round(modalProfitUsd * dollarRate);
  const modalMarginPercent =
    modalSellingPriceUsd > 0 ? ((modalProfitUsd / modalSellingPriceUsd) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-amber-500"></span>
          <span className="text-xs font-bold text-stone-600">Connecting to Canboso upstream API...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2.5">
            <Server className="w-7 h-7 text-amber-500" /> Canboso Upstream Stock
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
            Browse live stock, connect digital accounts, set Taka pricing, and preview USD margins
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn bg-white hover:bg-stone-50 border-2 border-stone-200 text-stone-900 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Sync Stock"}</span>
          </button>
          <Link
            href="/admin/settings"
            className="btn bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs shadow-xs"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* KPI & Balance Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Balance Card */}
        <div className="bg-white p-5 rounded-2xl border-2 border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shrink-0 shadow-xs">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Upstream Wallet
            </span>
            <div className="text-xl font-black text-stone-900 truncate">
              {balance ? `$${Number(balance.balanceUsd || 0).toFixed(2)} USD` : "Not Available"}
            </div>
            {balance && (
              <span className="text-[10px] text-stone-400 font-mono block truncate">
                {Number(balance.balanceVnd || 0).toLocaleString()} VND
              </span>
            )}
          </div>
        </div>

        {/* Total Upstream Items */}
        <div className="bg-white p-5 rounded-2xl border-2 border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Upstream Items
            </span>
            <div className="text-xl font-black text-stone-900">{upstreamProducts.length}</div>
            <span className="text-[10px] text-emerald-600 font-bold block">
              {upstreamProducts.filter((p) => p.stock > 0).length} in stock
            </span>
          </div>
        </div>

        {/* Connected Store Products */}
        <div className="bg-white p-5 rounded-2xl border-2 border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Store Catalog Linked
            </span>
            <div className="text-xl font-black text-emerald-600">
              {storeProducts.filter((p) => p.canbosoProductId).length}
            </div>
            <span className="text-[10px] text-stone-400 block">
              Connected to auto-fulfillment
            </span>
          </div>
        </div>

        {/* Exchange Rate Card */}
        <div className="bg-white p-5 rounded-2xl border-2 border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Active Rate
            </span>
            <div className="text-xl font-black text-stone-900">
              $1 = ৳{dollarRate}
            </div>
            <span className="text-[10px] text-stone-400 block">
              Changeable in Settings
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border-2 border-stone-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search upstream products by name or code..."
            className="input input-bordered w-full pr-10 focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 text-sm font-semibold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="select select-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 text-xs font-bold"
            value={stockFilter}
            onChange={(e: any) => setStockFilter(e.target.value)}
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (&gt;0)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          <select
            className="select select-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 text-xs font-bold"
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Connection Statuses</option>
            <option value="connected">Imported / Connected</option>
            <option value="not_connected">Not Yet Imported</option>
          </select>
        </div>
      </div>

      {/* Upstream Products Table */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold text-xs">
                <th>Product Name & ID</th>
                <th>Type</th>
                <th>Stock Available</th>
                <th>Upstream Cost (USD)</th>
                <th>Cost in BDT (~৳)</th>
                <th>Store Connection</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const connectedStoreProduct = storeProducts.find(
                    (sp) => sp.canbosoProductId === String(p.id || p.productId)
                  );
                  const itemCostUsd = Number(p.costUsd ?? (p as any)?.price?.amountUsd ?? 0);
                  const approxCostBdt = Math.round(itemCostUsd * dollarRate);

                  return (
                    <tr key={p.id || p.productId} className="border-b border-stone-100 hover:bg-stone-50/50">
                      <td>
                        <div className="font-extrabold text-stone-900 text-sm">{p.name}</div>
                        <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                          ID: {p.id || p.productId} {p.code ? `• Code: ${p.code}` : ""}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-stone-100 text-stone-700 border-none font-bold text-[10px] uppercase">
                          {p.type || "Account"}
                        </span>
                      </td>
                      <td>
                        {p.stock > 0 ? (
                          <span className="badge bg-emerald-100 text-emerald-800 border-none font-bold text-xs py-1.5 px-2.5">
                            {p.stock} in stock
                          </span>
                        ) : (
                          <span className="badge bg-rose-100 text-rose-800 border-none font-bold text-xs py-1.5 px-2.5">
                            Out of stock
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="font-mono font-bold text-stone-900 text-xs">
                          ${itemCostUsd.toFixed(2)} USD
                        </span>
                      </td>
                      <td>
                        <span className="font-bold text-amber-600 text-xs">
                          ~৳{approxCostBdt}
                        </span>
                      </td>
                      <td>
                        {connectedStoreProduct ? (
                          <div className="space-y-0.5">
                            <span className="badge bg-emerald-500 text-white font-bold text-[10px] border-none">
                              Linked to Store
                            </span>
                            <div className="text-[11px] font-bold text-stone-800 truncate max-w-[180px]">
                              {connectedStoreProduct.title} (৳{connectedStoreProduct.price})
                            </div>
                          </div>
                        ) : (
                          <span className="badge bg-stone-200 text-stone-600 font-bold text-[10px] border-none">
                            Not Imported
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {connectedStoreProduct && (
                            <Link
                              href={`/product/${connectedStoreProduct.slug}`}
                              target="_blank"
                              className="btn btn-xs btn-ghost text-stone-500 hover:text-stone-900"
                              title="View on storefront"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          <button
                            onClick={() => openImportModal(p)}
                            className={`btn btn-xs rounded-xl font-bold border-none px-3 ${
                              connectedStoreProduct
                                ? "bg-stone-900 hover:bg-stone-800 text-white"
                                : "bg-amber-400 hover:bg-amber-500 text-stone-950 shadow-xs"
                            }`}
                          >
                            {connectedStoreProduct ? "Edit Pricing" : "Import & Connect"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-stone-400 font-medium">
                    No Canboso products found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import & Connect Product Modal */}
      {mounted && isModalOpen && selectedProduct && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-stone-950/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative w-full max-w-2xl bg-white rounded-3xl border-2 border-stone-200 shadow-2xl text-stone-900 my-auto max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-stone-100 bg-white shrink-0">
              <div>
                <h3 className="font-black text-lg sm:text-xl text-stone-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  Connect Product to Store Catalog
                </h3>
                <span className="text-xs text-stone-500 mt-0.5 block">
                  Upstream: {selectedProduct.name} (ID: {selectedProduct.id})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-ghost btn-circle text-stone-400 hover:text-stone-700"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="canboso-import-form" onSubmit={handleImportSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 text-xs">
              {/* Live Profit Estimator Banner */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-amber-200/60">
                  <span className="font-bold text-stone-700 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    Live Accounting & Profit Calculation (Admin USD View)
                  </span>
                  <span className="badge bg-amber-400 text-stone-950 font-black text-[10px] border-none">
                    1 USD = ৳{dollarRate} BDT
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">
                      Selling Price
                    </span>
                    <span className="font-black text-stone-900 text-sm">
                      ৳{importForm.priceBdt}
                    </span>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      (${Number(modalSellingPriceUsd || 0).toFixed(2)} USD)
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">
                      Upstream Cost
                    </span>
                    <span className="font-black text-stone-900 text-sm">
                      ${Number(modalCostUsd || 0).toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      (~৳{Math.round((Number(modalCostUsd) || 0) * dollarRate)})
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">
                      Est. Profit / Unit
                    </span>
                    <span
                      className={`font-black text-sm ${
                        modalProfitUsd >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      ${Number(modalProfitUsd || 0).toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      (~৳{modalProfitBdt})
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">
                      Profit Margin
                    </span>
                    <span
                      className={`font-black text-sm ${
                        parseFloat(modalMarginPercent) >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {modalMarginPercent}%
                    </span>
                    <span className="text-[10px] text-stone-400 block">
                      {parseFloat(modalMarginPercent) > 20 ? "High Return" : "Standard"}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Marketing Copywriter Strip */}
              <div className="bg-gradient-to-r from-amber-50 via-amber-100/50 to-amber-50 border-2 border-amber-200/90 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4 text-stone-950" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-stone-900 leading-tight flex items-center gap-1.5">
                        <span>AI মার্কেটিং কপিরাইটার (OpenRouter)</span>
                        <span className="badge badge-xs bg-amber-400 text-stone-950 border-none font-bold">বাংলা</span>
                      </h4>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        ক্যানবোসো প্রোডাক্টের বিবরণ থেকে আকর্ষণীয় বাংলা টাইটেল ও বিস্তারিত মার্কেটিং ডেসক্রিপশন লিখুন
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateAiCopy()}
                    disabled={generatingAiCopy}
                    className="btn btn-sm bg-stone-950 hover:bg-stone-800 text-white border-none rounded-xl font-bold text-xs flex items-center gap-2 px-4 shadow-sm shrink-0"
                  >
                    {generatingAiCopy ? (
                      <>
                        <span className="loading loading-spinner loading-xs text-amber-400"></span>
                        <span>AI বাংলায় লিখছে...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>✨ AI দিয়ে বাংলায় লিখুন</span>
                      </>
                    )}
                  </button>
                </div>

                {aiSuccessMessage && (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{aiSuccessMessage}</span>
                  </div>
                )}

                {aiErrorMessage && (
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{aiErrorMessage}</span>
                  </div>
                )}
              </div>

              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-800">Storefront Title (বাংলা/ইংরেজি)</label>
                    <button
                      type="button"
                      onClick={() => handleGenerateAiCopy()}
                      disabled={generatingAiCopy}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{generatingAiCopy ? "Writing..." : "AI Rewrite"}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    className="input input-bordered focus:border-amber-400 rounded-xl bg-stone-50 text-stone-900 text-xs font-semibold w-full block"
                    value={importForm.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setImportForm((prev) => ({
                        ...prev,
                        title: newTitle,
                        slug: generateSlug(newTitle),
                      }));
                    }}
                  />
                </div>

                <div className="space-y-1.5 w-full">
                  <label className="block text-xs font-bold text-stone-800">URL Slug</label>
                  <input
                    type="text"
                    required
                    className="input input-bordered focus:border-amber-400 rounded-xl bg-stone-50 text-stone-900 text-xs font-mono w-full block"
                    value={importForm.slug}
                    onChange={(e) =>
                      setImportForm((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))
                    }
                  />
                </div>
              </div>

              {/* Pricing & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 w-full">
                  <label className="block text-xs font-bold text-stone-800">
                    Selling Price (৳ Taka) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="input input-bordered focus:border-amber-400 rounded-xl bg-stone-50 text-stone-900 text-xs font-bold w-full block"
                    value={importForm.priceBdt || ""}
                    onChange={(e) =>
                      setImportForm((prev) => ({
                        ...prev,
                        priceBdt: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1.5 w-full">
                  <label className="block text-xs font-bold text-stone-800">
                    Compare Price (৳ Strike)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1500"
                    className="input input-bordered focus:border-amber-400 rounded-xl bg-stone-50 text-stone-900 text-xs font-bold w-full block"
                    value={importForm.comparePriceBdt || ""}
                    onChange={(e) =>
                      setImportForm((prev) => ({
                        ...prev,
                        comparePriceBdt: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1.5 w-full">
                  <label className="block text-xs font-bold text-stone-800">Category</label>
                  <select
                    className="select select-bordered focus:border-amber-400 rounded-xl bg-stone-50 text-stone-900 text-xs font-semibold w-full block"
                    value={importForm.category}
                    onChange={(e) =>
                      setImportForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c.slug || c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Upload or URL */}
              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-stone-800">Product Thumbnail</label>
                <div className="flex items-center gap-3 w-full">
                  <input
                    type="text"
                    placeholder="Image URL or upload file..."
                    className="input input-bordered focus:border-amber-400 rounded-xl bg-stone-50 text-stone-900 text-xs flex-1 block"
                    value={importForm.image}
                    onChange={(e) =>
                      setImportForm((prev) => ({ ...prev, image: e.target.value }))
                    }
                  />
                  <label className="btn btn-outline btn-sm rounded-xl font-bold cursor-pointer text-xs flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? "Uploading..." : "Upload"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {importForm.image && (
                  <div className="mt-2 flex items-center gap-3 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <img
                      src={
                        importForm.image.startsWith("http")
                          ? importForm.image
                          : `${apiUrl}/${importForm.image.replace(/^\//, "")}`
                      }
                      alt="Preview"
                      className="w-14 h-14 object-contain rounded-lg border border-stone-200 bg-white p-0.5"
                    />
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-emerald-600 block">✓ Image attached successfully</span>
                      <span className="text-[10px] text-stone-500 font-mono truncate block">{importForm.image}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImportForm((prev) => ({ ...prev, image: "" }))}
                      className="btn btn-ghost btn-xs text-rose-500 font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-bold text-stone-800">
                      Product Description (বাংলা মার্কেটিং বর্ণনা)
                    </label>
                    <div className="flex items-center gap-1 bg-stone-200/70 p-0.5 rounded-lg text-[11px]">
                      <button
                        type="button"
                        onClick={() => setDescTab("edit")}
                        className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                          descTab === "edit"
                            ? "bg-white text-stone-900 shadow-2xs font-bold"
                            : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        এডিট (Code)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescTab("preview")}
                        className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                          descTab === "preview"
                            ? "bg-white text-stone-900 shadow-2xs font-bold"
                            : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        প্রিভিউ (Live)
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateAiCopy()}
                    disabled={generatingAiCopy}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{generatingAiCopy ? "Writing..." : "AI Generate Bangla"}</span>
                  </button>
                </div>
                {descTab === "edit" ? (
                  <textarea
                    rows={6}
                    placeholder="পণ্য পরিচিতি, সুবিধা ও ডেলিভারি বিবরণ..."
                    className="textarea textarea-bordered focus:border-amber-400 rounded-xl bg-stone-50 text-stone-900 text-xs font-mono leading-relaxed w-full block"
                    value={importForm.description}
                    onChange={(e) =>
                      setImportForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                ) : (
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-stone-200 bg-white p-2">
                    {importForm.description ? (
                      <FormattedDescription content={importForm.description} />
                    ) : (
                      <p className="text-xs text-stone-400 p-4 text-center">কোনো বিবরণ লেখা হয়নি।</p>
                    )}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <label className="label cursor-pointer justify-start gap-3 p-0">
                  <input
                    type="checkbox"
                    className="toggle toggle-warning toggle-sm"
                    checked={importForm.autoFulfill}
                    onChange={(e) =>
                      setImportForm((prev) => ({ ...prev, autoFulfill: e.target.checked }))
                    }
                  />
                  <div>
                    <span className="label-text font-bold text-stone-900 block">
                      Automated Upstream Purchasing
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      Instantly buys the item from Canboso and sends credentials to user upon payment
                    </span>
                  </div>
                </label>

                <div className="flex items-center gap-6 pt-2 border-t border-stone-200">
                  <label className="label cursor-pointer gap-2 p-0">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-warning checkbox-xs"
                      checked={importForm.isFeatured}
                      onChange={(e) =>
                        setImportForm((prev) => ({ ...prev, isFeatured: e.target.checked }))
                      }
                    />
                    <span className="label-text font-bold text-xs text-stone-800">
                      Featured Product
                    </span>
                  </label>

                  <label className="label cursor-pointer gap-2 p-0">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-warning checkbox-xs"
                      checked={importForm.isSlider}
                      onChange={(e) =>
                        setImportForm((prev) => ({ ...prev, isSlider: e.target.checked }))
                      }
                    />
                    <span className="label-text font-bold text-xs text-stone-800">
                      Show in Slider
                    </span>
                  </label>
                </div>
              </div>

            </form>

            {/* Fixed Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-stone-100 bg-stone-50/95 backdrop-blur-xs shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl font-bold px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="canboso-import-form"
                disabled={submittingImport}
                className="btn btn-sm bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold px-6 shadow-xs disabled:bg-stone-200 disabled:text-stone-400"
              >
                {submittingImport ? "Connecting..." : "Save & Connect Product"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
