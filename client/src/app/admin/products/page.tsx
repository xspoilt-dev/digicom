"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useModal } from "@/context/ModalContext";
import { getApiUrl } from "@/lib/api";
import { getCleanSnippet } from "@/components/FormattedDescription";
import ProviderComparisonModal, { ComparisonProductParam } from "@/components/ProviderComparisonModal";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Sliders,
  Sparkles,
  ExternalLink,
  Server,
  Search,
} from "lucide-react";

interface Product {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  type: "account" | "slot" | "license" | "course" | "pdf" | "video" | "zip" | "other";
  category?: string;
  providerId?: string;
  providerName?: string;
  canbosoProductId?: string;
  canbosoCostUsd?: number;
  serviceTag?: string;
  filePath?: string;
  deliveryLink?: string;
  thumbnailPath?: string;
  duration?: string;
  pageCount?: number;
  version?: string;
  showInSlider?: boolean;
  isFeatured?: boolean;
  displaySection?: string;
  checkoutFields: string[];
  isEmailDelivery: boolean;
  isWebDisplay: boolean;
  curriculum: { title: string; duration?: string }[];
  active: boolean;
}

interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
}

interface ProviderOption {
  _id: string;
  name: string;
  dollarRate?: number;
  isDefault?: boolean;
  balanceUsd?: number;
}

export default function ProductsPage() {
  const { showAlert, showConfirm } = useModal();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Provider Comparison AI Modal State
  const [comparisonProduct, setComparisonProduct] = useState<ComparisonProductParam | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  const openCompareModal = (p: Product) => {
    setComparisonProduct({
      title: p.title,
      productId: p._id,
      priceBdt: p.price,
      currentProviderId: p.providerId,
      currentProviderName: p.providerName,
      upstreamProductId: p.canbosoProductId,
    });
    setIsComparisonModalOpen(true);
  };

  // Read URL query parameter for provider filter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const provParam = urlParams.get("providerId");
      if (provParam) {
        setProviderFilter(provParam);
      }
    }
  }, []);

  const apiUrl = getApiUrl();

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodsRes, catsRes, provsRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/products`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}/api/admin/categories`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}/api/admin/providers`, { headers: getAuthHeaders() }),
      ]);

      const prodsData = await prodsRes.json();
      if (prodsData.success) setProducts(prodsData.products);

      const catsData = await catsRes.json();
      if (catsData.success && Array.isArray(catsData.categories)) {
        setCategories(catsData.categories);
      }

      const provsData = await provsRes.json();
      if (provsData.success && Array.isArray(provsData.providers)) {
        setProviders(provsData.providers);
      }
    } catch (err) {
      console.error("Error loading products/categories/providers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiUrl]);

  const toggleProductFlag = async (product: Product, flag: "showInSlider" | "isFeatured" | "active") => {
    try {
      const updatedValue = !product[flag];
      const res = await fetch(`${apiUrl}/api/admin/products/${product._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...product, [flag]: updatedValue }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(products.map((p) => (p._id === product._id ? { ...p, [flag]: updatedValue } : p)));
      }
    } catch (err) {
      console.error("Error toggling product flag:", err);
    }
  };

  const deleteProduct = async (id: string) => {
    const confirmed = await showConfirm({
      title: "Delete Product",
      message: "Are you sure you want to delete this product? This action cannot be undone.",
      type: "warning",
      confirmText: "Delete Product",
      isDestructive: true,
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${apiUrl}/api/admin/products/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(products.filter((p) => p._id !== id));
        await showAlert({
          title: "Deleted",
          message: "Product deleted successfully.",
          type: "success",
        });
      } else {
        await showAlert({
          title: "Error",
          message: data.message || "Failed to delete product.",
          type: "error",
        });
      }
    } catch (err) {
      await showAlert({
        title: "Error",
        message: "Error deleting product.",
        type: "error",
      });
    }
  };

  const filteredProducts = products.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchSlug = p.slug.toLowerCase().includes(q);
      const matchType = p.type.toLowerCase().includes(q);
      if (!matchTitle && !matchSlug && !matchType) return false;
    }
    if (categoryFilter !== "all" && p.category !== categoryFilter) {
      return false;
    }
    if (providerFilter !== "all") {
      if (providerFilter === "none") {
        if (p.providerId || p.canbosoProductId) return false;
      } else {
        if (p.providerId !== providerFilter) return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-amber-500" /> Product Catalog
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
            Manage products, pricing, categories, slider placements, and download links
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Search & Provider Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border-2 border-stone-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search products by title, slug, or type..."
            className="input input-bordered input-sm rounded-xl w-full pl-9 text-xs bg-stone-50 text-stone-900 border-stone-200 focus:border-amber-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            className="select select-bordered select-sm rounded-xl font-bold text-xs bg-stone-50 text-stone-900 border-stone-200"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Provider Filter */}
          <select
            className="select select-bordered select-sm rounded-xl font-bold text-xs bg-stone-50 text-stone-900 border-stone-200"
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
          >
            <option value="all">All Providers</option>
            {providers.map((pr) => (
              <option key={pr._id} value={pr._id}>
                Provider: {pr.name}
              </option>
            ))}
            <option value="none">Manual / No Provider</option>
          </select>

          {(searchQuery || categoryFilter !== "all" || providerFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setProviderFilter("all");
              }}
              className="btn btn-ghost btn-sm text-stone-500 hover:text-stone-900 text-xs rounded-xl"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p) => (
            <div
              key={p._id}
              className="bg-white border-2 border-stone-200 shadow-sm hover:border-amber-300 transition-all rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              {/* Product Cover Thumbnail */}
              {p.thumbnailPath ? (
                <div className="h-44 w-full bg-stone-50 overflow-hidden relative border-b border-stone-100 flex items-center justify-center p-2">
                  <img
                    src={`${apiUrl}/${p.thumbnailPath}`}
                    alt={p.title}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 flex flex-wrap gap-1">
                    {p.showInSlider && (
                      <span className="badge bg-amber-400 text-stone-950 font-bold text-[10px] border-none shadow-sm flex items-center gap-1">
                        <Sliders className="w-2.5 h-2.5" /> Slider
                      </span>
                    )}
                    {p.isFeatured && (
                      <span className="badge bg-stone-900 text-white font-bold text-[10px] border-none shadow-sm flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Featured
                      </span>
                    )}
                    <span
                      className={`badge ${
                        p.active ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                      } font-bold text-[10px] border-none shadow-sm`}
                    >
                      {p.active ? "Active" : "Hidden"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-24 bg-stone-100 p-3 flex justify-between items-start border-b border-stone-200">
                  <div className="flex flex-wrap gap-1">
                    {p.showInSlider && (
                      <span className="badge bg-amber-400 text-stone-950 font-bold text-[10px] border-none">
                        Slider
                      </span>
                    )}
                    {p.isFeatured && (
                      <span className="badge bg-stone-900 text-white font-bold text-[10px] border-none">
                        Featured
                      </span>
                    )}
                    <span
                      className={`badge ${
                        p.active ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                      } font-bold text-[10px] border-none`}
                    >
                      {p.active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-medium italic">No image</span>
                </div>
              )}

              {/* Card Body */}
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex justify-between items-center gap-2 mb-2">
                    <span className="badge bg-stone-100 text-stone-700 font-bold text-[10px] border border-stone-200 uppercase tracking-wide">
                      {p.type}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {p.compareAtPrice && p.compareAtPrice > p.price && (
                        <span className="text-xs text-stone-400 line-through">৳{p.compareAtPrice}</span>
                      )}
                      <span className="font-black text-base text-amber-600">৳{p.price}</span>
                    </div>
                  </div>
                  <h3 className="text-stone-900 text-base font-bold line-clamp-1 mb-1">
                    {p.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-amber-700">
                      Category: /{p.category || p.type || "account"}
                    </span>
                    {p.providerName || p.canbosoProductId ? (
                      <span className="badge bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                        <Server className="w-2.5 h-2.5 text-amber-600" />
                        {p.providerName || "Canboso"}
                      </span>
                    ) : (
                      <span className="badge bg-stone-100 text-stone-600 border border-stone-200 text-[10px] font-semibold">
                        Manual Local
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 line-clamp-2 mb-4">
                    {getCleanSnippet(p.description, 100)}
                  </p>
                </div>

                {/* Quick Toggle Controls */}
                <div className="space-y-2 pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-600">Top Slider:</span>
                    <button
                      type="button"
                      onClick={() => toggleProductFlag(p, "showInSlider")}
                      className={`btn btn-xs rounded-lg font-bold border-none ${
                        p.showInSlider
                          ? "bg-amber-400 hover:bg-amber-500 text-stone-950"
                          : "bg-stone-100 hover:bg-stone-200 text-stone-600"
                      }`}
                    >
                      {p.showInSlider ? "Active in Slider" : "Not in Slider"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-600">Featured:</span>
                    <button
                      type="button"
                      onClick={() => toggleProductFlag(p, "isFeatured")}
                      className={`btn btn-xs rounded-lg font-bold border-none ${
                        p.isFeatured
                          ? "bg-stone-900 hover:bg-stone-800 text-amber-400"
                          : "bg-stone-100 hover:bg-stone-200 text-stone-600"
                      }`}
                    >
                      {p.isFeatured ? "Featured" : "Standard"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-600">Status:</span>
                    <button
                      type="button"
                      onClick={() => toggleProductFlag(p, "active")}
                      className={`btn btn-xs rounded-lg font-bold border-none ${
                        p.active
                          ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                          : "bg-rose-100 hover:bg-rose-200 text-rose-800"
                      }`}
                    >
                      {p.active ? "Published" : "Draft"}
                    </button>
                  </div>
                </div>

                {/* Action Row */}
                <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <a
                    href={`/product/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-xs text-stone-600 hover:text-stone-900 font-bold flex items-center gap-1"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openCompareModal(p)}
                      className="btn btn-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-bold flex items-center gap-1 shadow-2xs"
                      title="Compare price & stock across all providers with AI"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Compare AI</span>
                    </button>
                    <Link
                      href={`/admin/products/${p._id}`}
                      className="btn btn-xs bg-stone-100 hover:bg-stone-200 text-stone-800 border-none rounded-lg font-bold flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => deleteProduct(p._id!)}
                      className="btn btn-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border-none rounded-lg font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border-2 border-dashed border-stone-200">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-700">No products found</h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">Add your first digital product to begin selling</p>
            <Link
              href="/admin/products/new"
              className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold btn-sm"
            >
              + Create Product
            </Link>
          </div>
        )}
      </div>

      {/* AI Provider Comparison Modal */}
      <ProviderComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        product={comparisonProduct}
        onAssignSuccess={() => fetchData()}
        onSelectProvider={() => {
          fetchData();
        }}
      />
    </div>
  );
}
