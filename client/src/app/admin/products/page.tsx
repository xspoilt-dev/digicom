"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useModal } from "@/context/ModalContext";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Sliders,
  Sparkles,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Tag,
  Eye,
  X,
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

export default function ProductsPage() {
  const { showAlert, showConfirm } = useModal();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [curriculumTitle, setCurriculumTitle] = useState("");
  const [curriculumDuration, setCurriculumDuration] = useState("");

  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isProductModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProductModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProductModalOpen]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
      const [prodsRes, catsRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/products`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}/api/admin/categories`, { headers: getAuthHeaders() }),
      ]);

      const prodsData = await prodsRes.json();
      if (prodsData.success) setProducts(prodsData.products);

      const catsData = await catsRes.json();
      if (catsData.success && Array.isArray(catsData.categories)) {
        setCategories(catsData.categories);
      }
    } catch (err) {
      console.error("Error loading products/categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiUrl]);

  const openProductCreate = () => {
    const defaultCat = categories.length > 0 ? categories[0].slug : "account";
    setSelectedProduct({
      title: "",
      slug: "",
      description: "",
      price: 0,
      compareAtPrice: undefined,
      type: "account",
      category: defaultCat,
      filePath: "",
      deliveryLink: "",
      thumbnailPath: "",
      showInSlider: false,
      isFeatured: false,
      displaySection: "all",
      checkoutFields: ["name", "email", "phone"],
      isEmailDelivery: true,
      isWebDisplay: true,
      curriculum: [],
      active: true,
    });
    setIsProductModalOpen(true);
  };

  const openProductEdit = (product: Product) => {
    setSelectedProduct({
      ...product,
      category: product.category || product.type || "account",
      showInSlider: product.showInSlider ?? false,
      isFeatured: product.isFeatured ?? false,
      displaySection: product.displaySection || "all",
    });
    setIsProductModalOpen(true);
  };

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

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const method = selectedProduct._id ? "PUT" : "POST";
      const path = selectedProduct._id ? `/api/admin/products/${selectedProduct._id}` : "/api/admin/products";

      const res = await fetch(`${apiUrl}${path}`, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(selectedProduct),
      });
      const data = await res.json();
      if (data.success) {
        setIsProductModalOpen(false);
        await showAlert({
          title: "Product Saved",
          message: "Product saved successfully.",
          type: "success",
        });
        fetchData();
      } else {
        await showAlert({
          title: "Save Failed",
          message: data.message || "Failed to save product.",
          type: "error",
        });
      }
    } catch (err) {
      await showAlert({
        title: "Error",
        message: "Error saving product.",
        type: "error",
      });
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isThumbnail: boolean) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProduct) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", isThumbnail ? "thumbnail" : "product-file");

    if (isThumbnail) setUploadingThumbnail(true);
    else setUploadingFile(true);

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${apiUrl}/api/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        if (isThumbnail) {
          setSelectedProduct({ ...selectedProduct, thumbnailPath: data.filePath });
        } else {
          setSelectedProduct({ ...selectedProduct, filePath: data.filePath });
        }
      } else {
        await showAlert({
          title: "Upload Failed",
          message: data.message || "File upload failed.",
          type: "error",
        });
      }
    } catch (err) {
      await showAlert({
        title: "Upload Error",
        message: "Error during file upload.",
        type: "error",
      });
    } finally {
      if (isThumbnail) setUploadingThumbnail(false);
      else setUploadingFile(false);
    }
  };

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
        <button
          onClick={openProductCreate}
          className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length > 0 ? (
          products.map((p) => (
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
                  <div className="text-[11px] font-semibold text-amber-700 mb-2">
                    Category: /{p.category || p.type || "account"}
                  </div>
                  <p className="text-xs text-stone-600 line-clamp-2 mb-4">
                    {p.description}
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => openProductEdit(p)}
                      className="btn btn-xs bg-stone-100 hover:bg-stone-200 text-stone-800 border-none rounded-lg font-bold flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
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
            <button
              onClick={openProductCreate}
              className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold btn-sm"
            >
              + Create Product
            </button>
          </div>
        )}
      </div>

      {/* Product Edit / Create Modal */}
      {mounted && isProductModalOpen && selectedProduct && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-stone-950/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsProductModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative w-full max-w-2xl bg-white rounded-3xl border-2 border-stone-200 shadow-2xl text-stone-900 my-auto max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-stone-100 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-lg sm:text-xl text-stone-900 tracking-tight">
                    {selectedProduct._id ? "Edit Product Details" : "Add New Digital Product"}
                  </h2>
                  <span className="text-[11px] text-stone-500 font-medium block">
                    Product listing, Taka pricing, and automated delivery
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost text-stone-400 hover:text-stone-700"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="product-admin-form" onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-stone-700">Product Title *</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm font-semibold"
                    value={selectedProduct.title}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, title: e.target.value })}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-stone-700">URL Slug (Unique) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm font-mono"
                    value={selectedProduct.slug}
                    placeholder="e.g. chatgpt-plus"
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-stone-700">Description *</span>
                </label>
                <textarea
                  required
                  rows={3}
                  className="textarea textarea-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm leading-relaxed"
                  value={selectedProduct.description}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                />
              </div>

              {/* Price, Compare-At, and Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-stone-700">Price (BDT) *</span>
                  </label>
                  <input
                    type="number"
                    required
                    className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm font-bold"
                    value={selectedProduct.price}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, price: Number(e.target.value) })}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-stone-700">Compare at Price (BDT)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered focus:border-amber-400 focus:ring-2 focus:ring-amber-200 rounded-xl text-stone-900 bg-stone-50 w-full text-sm font-bold"
                    value={selectedProduct.compareAtPrice || ""}
                    placeholder="Original price"
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        compareAtPrice: Number(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-stone-700">Product Type</span>
                  </label>
                  <select
                    className="select select-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 w-full text-sm"
                    value={selectedProduct.type}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, type: e.target.value as any })}
                  >
                    <option value="account">Private Account (Instant Delivery)</option>
                    <option value="slot">Team / Workspace Slot (Email Invite)</option>
                    <option value="license">Software License Key</option>
                    <option value="course">Video Course</option>
                    <option value="pdf">PDF Book</option>
                    <option value="video">Video Resource</option>
                    <option value="zip">ZIP Archive</option>
                    <option value="other">Other Digital Good</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Category Selector */}
              <div className="form-control w-full">
                <label className="label py-1 flex justify-between items-center">
                  <span className="label-text font-bold text-xs text-stone-700">Campaign Category & Route *</span>
                  <span className="text-[11px] text-amber-600 font-bold">
                    URL: /category/{selectedProduct.category || selectedProduct.type || "account"}
                  </span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="select select-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 text-sm flex-1 font-semibold"
                    value={selectedProduct.category || selectedProduct.type || "account"}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, category: e.target.value })}
                  >
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <option key={cat._id} value={cat.slug}>
                          {cat.name} (/category/{cat.slug})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="account">Private Accounts (/category/account)</option>
                        <option value="slot">Team Slots (/category/slot)</option>
                        <option value="license">License Keys (/category/license)</option>
                        <option value="streaming">Streaming (/category/streaming)</option>
                        <option value="creative">AI & Creative (/category/creative)</option>
                      </>
                    )}
                  </select>
                  <input
                    type="text"
                    placeholder="Custom slug"
                    className="input input-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 text-sm w-44 font-mono"
                    value={selectedProduct.category || ""}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        category: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      })
                    }
                  />
                </div>
              </div>

              {/* Placement Checkboxes */}
              <div className="border border-stone-200 rounded-2xl p-5 space-y-3 bg-stone-50/70">
                <span className="font-extrabold text-xs text-stone-800 uppercase tracking-wider block">
                  Storefront Display Placements
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold bg-white p-3 rounded-xl border border-stone-200 hover:border-amber-400">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-warning checkbox-xs"
                      checked={selectedProduct.showInSlider || false}
                      onChange={(e) =>
                        setSelectedProduct({ ...selectedProduct, showInSlider: e.target.checked })
                      }
                    />
                    <span>Top Compact Slider</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold bg-white p-3 rounded-xl border border-stone-200 hover:border-amber-400">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-warning checkbox-xs"
                      checked={selectedProduct.isFeatured || false}
                      onChange={(e) =>
                        setSelectedProduct({ ...selectedProduct, isFeatured: e.target.checked })
                      }
                    />
                    <span>Featured Section</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold bg-white p-3 rounded-xl border border-stone-200 hover:border-amber-400">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-warning checkbox-xs"
                      checked={selectedProduct.active}
                      onChange={(e) =>
                        setSelectedProduct({ ...selectedProduct, active: e.target.checked })
                      }
                    />
                    <span>Active / Visible</span>
                  </label>
                </div>
              </div>

              {/* Product Cover Image Upload */}
              <div className="border border-stone-200 rounded-2xl p-5 space-y-3 bg-white">
                <span className="font-extrabold text-xs text-stone-800 uppercase tracking-wider block">
                  Product Thumbnail Image
                </span>

                {selectedProduct.thumbnailPath ? (
                  <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                    <img
                      src={`${apiUrl}/${selectedProduct.thumbnailPath}`}
                      alt="Thumbnail"
                      className="w-16 h-16 object-contain rounded-xl border border-stone-200 bg-white p-0.5"
                    />
                    <div className="flex-1 overflow-hidden">
                      <span className="text-xs font-mono truncate block text-stone-700">
                        {selectedProduct.thumbnailPath}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedProduct({ ...selectedProduct, thumbnailPath: "" })}
                        className="text-xs text-rose-600 font-bold hover:underline mt-1"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="file-input file-input-bordered file-input-sm w-full rounded-xl bg-stone-50 text-stone-900 border-stone-300"
                    />
                    {uploadingThumbnail && <span className="loading loading-spinner loading-xs text-amber-500"></span>}
                  </div>
                )}
              </div>

              {/* Digital File Delivery / Link */}
              <div className="border border-stone-200 rounded-2xl p-5 space-y-4 bg-white">
                <span className="font-extrabold text-xs text-stone-800 uppercase tracking-wider block">
                  Fulfillment & Digital Delivery (Instant Unlock)
                </span>

                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-stone-700">
                      External Delivery Link / Private Credentials URL
                    </span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... or login link"
                    className="input input-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 w-full text-sm"
                    value={selectedProduct.deliveryLink || ""}
                    onChange={(e) =>
                      setSelectedProduct({ ...selectedProduct, deliveryLink: e.target.value })
                    }
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-stone-700">
                      Or Upload Digital File (PDF, ZIP, License)
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(e, false)}
                      className="file-input file-input-bordered file-input-sm w-full rounded-xl bg-stone-50 text-stone-900 border-stone-300"
                    />
                    {uploadingFile && <span className="loading loading-spinner loading-xs text-amber-500"></span>}
                  </div>
                  {selectedProduct.filePath && (
                    <span className="text-xs font-mono text-emerald-700 mt-1 block">
                      Saved File: {selectedProduct.filePath}
                    </span>
                  )}
                </div>
              </div>

            </form>

            {/* Fixed Modal Footer */}
            <div className="border-t border-stone-100 p-4 sm:p-5 bg-stone-50/95 backdrop-blur-xs flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="btn btn-sm bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl font-bold px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-admin-form"
                className="btn btn-sm bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold px-6 shadow-xs"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
