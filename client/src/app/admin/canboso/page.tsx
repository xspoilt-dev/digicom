"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useModal } from "@/context/ModalContext";
import { getApiUrl } from "@/lib/api";
import ProviderComparisonModal, { ComparisonProductParam } from "@/components/ProviderComparisonModal";
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

interface ProviderOption {
  _id: string;
  name: string;
  dollarRate: number;
  isDefault: boolean;
  isActive: boolean;
  balanceUsd?: number;
  balanceVnd?: number;
}

export default function CanbosoStockPage() {
  const { showAlert } = useModal();
  const [mounted, setMounted] = useState(false);
  const [upstreamProducts, setUpstreamProducts] = useState<UpstreamProduct[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [dollarRate, setDollarRate] = useState<number>(127);
  const [balance, setBalance] = useState<{ balanceUsd: number; balanceVnd: number } | null>(null);

  // Multi-Provider state
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "connected" | "not_connected">("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  // AI Multi-Provider Comparison Modal State
  const [comparisonProduct, setComparisonProduct] = useState<ComparisonProductParam | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  const openCompareModal = (p: UpstreamProduct, connected?: StoreProduct) => {
    const rawCostUsd = Number(p.costUsd ?? (p as any)?.price?.amountUsd ?? 0);
    setComparisonProduct({
      title: p.name,
      code: p.code,
      priceBdt: connected?.price || Math.round(rawCostUsd * dollarRate * 1.3),
      productId: connected?._id,
      currentProviderId: selectedProviderId,
      upstreamProductId: String(p.id || p.productId),
    });
    setIsComparisonModalOpen(true);
  };

  const apiUrl = getApiUrl();

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const loadData = async (isRefresh = false, providerIdOverride?: string) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch providers
      let activeProviderId = providerIdOverride !== undefined ? providerIdOverride : selectedProviderId;
      try {
        const provRes = await fetch(`${apiUrl}/api/admin/providers`, { headers: getAuthHeaders() });
        const provData = await provRes.json();
        if (provData.success && Array.isArray(provData.providers)) {
          setProviders(provData.providers);
          if (!activeProviderId && provData.providers.length > 0) {
            const def = provData.providers.find((p: any) => p.isDefault) || provData.providers[0];
            activeProviderId = def._id;
            setSelectedProviderId(activeProviderId);
          }
        }
      } catch (e) {
        console.error("Error loading providers:", e);
      }

      const providerParam = activeProviderId ? `?providerId=${activeProviderId}` : "";

      const [upstreamRes, storeProdsRes, catsRes, balanceRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/canboso/products${providerParam}`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}/api/admin/products`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}/api/admin/categories`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}/api/admin/canboso/balance${providerParam}`, { headers: getAuthHeaders() }),
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
      console.error("Error loading Upstream data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiUrl]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2.5">
            <Server className="w-7 h-7 text-amber-500" /> Upstream Stock &amp; Automation
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
            Browse live stock across providers, connect digital products, set Taka pricing, and preview margins
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {providers.length > 0 && (
            <div className="flex items-center gap-2 bg-white border-2 border-stone-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Provider:</span>
              <select
                value={selectedProviderId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedProviderId(newId);
                  loadData(true, newId);
                }}
                className="bg-transparent font-bold text-xs text-stone-900 focus:outline-none cursor-pointer"
              >
                {providers.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.isDefault ? "(Default)" : ""} {p.balanceUsd !== undefined ? `• $${Number(p.balanceUsd).toFixed(2)}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn bg-white hover:bg-stone-50 border-2 border-stone-200 text-stone-900 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Sync Stock"}</span>
          </button>
          <Link
            href="/admin/settings#canboso"
            className="btn bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs shadow-xs"
          >
            Manage Providers
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
              Wallet ({providers.find((p) => p._id === selectedProviderId)?.name || "Primary"})
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
                            <Link
                              href={`/admin/products/${connectedStoreProduct._id}`}
                              className="text-[11px] font-bold text-stone-800 hover:text-amber-600 truncate max-w-[180px] block transition-colors underline"
                              title="Edit in full-page product editor"
                            >
                              {connectedStoreProduct.title} (৳{connectedStoreProduct.price})
                            </Link>
                          </div>
                        ) : (
                          <span className="badge bg-stone-200 text-stone-600 font-bold text-[10px] border-none">
                            Not Imported
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openCompareModal(p, connectedStoreProduct)}
                            className="btn btn-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold flex items-center gap-1 shadow-2xs"
                            title="Compare quotes & stock across all providers with AI"
                          >
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span className="hidden sm:inline">Compare</span>
                          </button>
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
                          {connectedStoreProduct ? (
                            <Link
                              href={`/admin/products/${connectedStoreProduct._id}`}
                              className="btn btn-xs rounded-xl font-bold bg-stone-900 hover:bg-stone-800 text-white border-none px-3 shadow-xs"
                            >
                              Edit Pricing
                            </Link>
                          ) : (
                            <Link
                              href={`/admin/products/new?upstreamId=${encodeURIComponent(String(p.id || p.productId))}&providerId=${encodeURIComponent(selectedProviderId || "")}&name=${encodeURIComponent(p.name)}&costUsd=${itemCostUsd}&code=${encodeURIComponent(p.code || "")}&type=${encodeURIComponent(p.type || "account")}&returnUrl=${encodeURIComponent("/admin/canboso")}`}
                              className="btn btn-xs rounded-xl font-bold bg-amber-400 hover:bg-amber-500 text-stone-950 border-none px-3 shadow-xs"
                            >
                              Import & Connect
                            </Link>
                          )}
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


      {/* AI Provider Comparison Modal */}
      <ProviderComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        product={comparisonProduct}
        onAssignSuccess={() => loadData()}
        onSelectProvider={(provId, provName, upId, costUsd) => {
          setSelectedProviderId(provId);
          loadData();
        }}
      />
    </div>
  );
}
