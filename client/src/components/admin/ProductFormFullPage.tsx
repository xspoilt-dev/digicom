"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useModal } from "@/context/ModalContext";
import { getApiUrl } from "@/lib/api";
import HtmlEditor from "@/components/admin/HtmlEditor";
import ProviderComparisonModal, { ComparisonProductParam } from "@/components/ProviderComparisonModal";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import {
  ArrowLeft,
  Save,
  Package,
  Server,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Tag,
  DollarSign,
  TrendingUp,
  Sliders,
  ShieldCheck,
  Plus,
  Trash2,
  FileText,
  HardDrive,
} from "lucide-react";

export interface ProductPayload {
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

interface ProductFormFullPageProps {
  mode: "create" | "edit";
  productId?: string;
}

const DEFAULT_PRODUCT: ProductPayload = {
  title: "",
  slug: "",
  description: "",
  price: 0,
  type: "account",
  category: "account",
  checkoutFields: ["email", "whatsapp"],
  isEmailDelivery: true,
  isWebDisplay: true,
  curriculum: [],
  active: true,
  showInSlider: false,
  isFeatured: false,
};

export default function ProductFormFullPage({ mode, productId }: ProductFormFullPageProps) {
  const { showAlert } = useModal();
  const router = useRouter();
  const apiUrl = getApiUrl();

  const [product, setProduct] = useState<ProductPayload>(DEFAULT_PRODUCT);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState<boolean>(false);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [generatingAiCopy, setGeneratingAiCopy] = useState<boolean>(false);

  // Curriculum Form States
  const [curriculumTitle, setCurriculumTitle] = useState<string>("");
  const [curriculumDuration, setCurriculumDuration] = useState<string>("");

  // File Input Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // AI Provider Comparison Modal State
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
  const [comparisonProduct, setComparisonProduct] = useState<ComparisonProductParam | null>(null);

  // Media Picker Modal State
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState<boolean>(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"thumbnail" | "file">("thumbnail");

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catsRes, provsRes] = await Promise.all([
          fetch(`${apiUrl}/api/admin/categories`, { headers: getAuthHeaders() }),
          fetch(`${apiUrl}/api/admin/providers`, { headers: getAuthHeaders() }),
        ]);

        const catsData = await catsRes.json();
        if (catsData.success && Array.isArray(catsData.categories)) {
          setCategories(catsData.categories);
        }

        const provsData = await provsRes.json();
        if (provsData.success && Array.isArray(provsData.providers)) {
          setProviders(provsData.providers);
        }

        if (mode === "edit" && productId) {
          const prodRes = await fetch(`${apiUrl}/api/admin/products/${productId}`, {
            headers: getAuthHeaders(),
          });
          const prodData = await prodRes.json();
          if (prodData.success && prodData.product) {
            setProduct(prodData.product);
          } else {
            await showAlert({
              title: "Product Not Found",
              message: "The requested product could not be loaded.",
              type: "error",
            });
            router.push("/admin/products");
          }
        } else if (mode === "create" && typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const upstreamId = params.get("upstreamId") || params.get("canbosoProductId");
          if (upstreamId) {
            const providerId = params.get("providerId") || "";
            const name = params.get("name") || params.get("title") || "";
            const costUsd = parseFloat(params.get("costUsd") || "0") || 0;
            const code = params.get("code") || params.get("serviceTag") || "";
            const prodType = (params.get("type") as any) || "account";
            const cat = params.get("category") || "account";

            const matchingProv =
              provsData.success && Array.isArray(provsData.providers)
                ? provsData.providers.find((p: any) => p._id === providerId) ||
                  provsData.providers.find((p: any) => p.isDefault) ||
                  provsData.providers[0]
                : null;
            const dollarRate = matchingProv?.dollarRate || 127;
            const estCostBdt = costUsd * dollarRate;
            const defaultPriceBdt = costUsd > 0 ? Math.ceil((estCostBdt * 1.35) / 10) * 10 : 0;
            const defaultCompareBdt = defaultPriceBdt > 0 ? Math.ceil((defaultPriceBdt * 1.25) / 10) * 10 : 0;

            setProduct((prev) => ({
              ...prev,
              title: name || prev.title,
              slug: name ? generateSlug(name) : prev.slug,
              providerId: providerId || matchingProv?._id || prev.providerId,
              providerName: matchingProv?.name || prev.providerName,
              canbosoProductId: upstreamId,
              canbosoCostUsd: costUsd,
              serviceTag: code,
              type: prodType,
              category: cat,
              price: defaultPriceBdt || prev.price,
              compareAtPrice: defaultCompareBdt || prev.compareAtPrice,
              description:
                prev.description ||
                (name
                  ? `<p>Official digital subscription and license for <strong>${name}</strong>. Instant automated activation and access delivered immediately upon payment.</p>`
                  : ""),
            }));
          }
        }
      } catch (err: any) {
        console.error("Error loading product editor:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [mode, productId, apiUrl]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleGenerateAiCopy = async () => {
    if (!product.title?.trim()) {
      await showAlert({
        title: "Product Title Required",
        message: "Please enter a product title first so AI knows what to write about.",
        type: "warning",
      });
      return;
    }

    setGeneratingAiCopy(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/ai/generate-copy`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: product.title,
          description: product.description,
          type: product.type,
          category: product.category,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const cleanTitle = String(data.title || product.title)
          .replace(/^\{?\s*"title"\s*:\s*"?/i, "")
          .replace(/"?[,}]?\s*$/, "")
          .trim();
        const cleanSlug = String(data.slug || product.slug)
          .replace(/^\{?\s*"slug"\s*:\s*"?/i, "")
          .replace(/"?[,}]?\s*$/, "")
          .trim();

        setProduct((prev) => ({
          ...prev,
          title: cleanTitle || prev.title,
          slug: cleanSlug || prev.slug,
          description: data.description || prev.description,
        }));

        await showAlert({
          title: "AI Copy Generated",
          message: "Bangla marketing title and description generated successfully!",
          type: "success",
        });
      } else {
        await showAlert({
          title: "AI Generation Error",
          message: data.message || "Failed to generate AI copy.",
          type: "error",
        });
      }
    } catch (err: any) {
      await showAlert({
        title: "Network Error",
        message: err.message || "Failed to reach AI service.",
        type: "error",
      });
    } finally {
      setGeneratingAiCopy(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isThumbnail: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          setProduct((prev) => ({ ...prev, thumbnailPath: data.filePath }));
        } else {
          setProduct((prev) => ({ ...prev, filePath: data.filePath }));
        }
      } else {
        await showAlert({
          title: "Upload Failed",
          message: data.message || "File upload failed.",
          type: "error",
        });
      }
    } catch {
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

  const handleDeleteFile = async (isThumbnail: boolean) => {
    const targetPath = isThumbnail ? product.thumbnailPath : product.filePath;
    if (!targetPath) return;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      await fetch(`${apiUrl}/api/admin/upload/delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath: targetPath }),
      });
    } catch (err) {
      console.warn("Could not delete file from server:", err);
    }

    if (isThumbnail) {
      setProduct((prev) => ({ ...prev, thumbnailPath: "" }));
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = "";
      }
    } else {
      setProduct((prev) => ({ ...prev, filePath: "" }));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.title.trim()) {
      await showAlert({ title: "Validation Error", message: "Title is required.", type: "warning" });
      return;
    }
    if (!product.slug.trim()) {
      await showAlert({ title: "Validation Error", message: "Slug is required.", type: "warning" });
      return;
    }
    if (product.price <= 0) {
      await showAlert({ title: "Validation Error", message: "Price must be greater than 0.", type: "warning" });
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = mode === "edit" && productId;
      const url = isEdit ? `${apiUrl}/api/admin/products/${productId}` : `${apiUrl}/api/admin/products`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(product),
      });

      const data = await res.json();
      if (data.success) {
        await showAlert({
          title: isEdit ? "Product Updated" : "Product Created",
          message: `Product "${product.title}" has been saved successfully!`,
          type: "success",
        });
        const returnUrl =
          (typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("returnUrl")
            : null) || "/admin/products";
        router.push(returnUrl);
      } else {
        await showAlert({
          title: "Save Failed",
          message: data.message || data.error || "Failed to save product.",
          type: "error",
        });
      }
    } catch (err: any) {
      await showAlert({
        title: "Network Error",
        message: err.message || "Failed to save product.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCheckoutField = (field: string) => {
    const current = product.checkoutFields || [];
    if (current.includes(field)) {
      setProduct({ ...product, checkoutFields: current.filter((f) => f !== field) });
    } else {
      setProduct({ ...product, checkoutFields: [...current, field] });
    }
  };

  const handleAddCurriculum = () => {
    if (!curriculumTitle.trim()) return;
    setProduct({
      ...product,
      curriculum: [...(product.curriculum || []), { title: curriculumTitle, duration: curriculumDuration }],
    });
    setCurriculumTitle("");
    setCurriculumDuration("");
  };

  const handleRemoveCurriculum = (index: number) => {
    setProduct({
      ...product,
      curriculum: (product.curriculum || []).filter((_, i) => i !== index),
    });
  };

  const openCompareModal = () => {
    setComparisonProduct({
      title: product.title,
      productId: product._id,
      priceBdt: product.price,
      currentProviderId: product.providerId,
      currentProviderName: product.providerName,
      upstreamProductId: product.canbosoProductId,
    });
    setIsComparisonModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <span className="loading loading-spinner loading-lg text-amber-500"></span>
        <span className="text-xs font-bold text-stone-500">Loading product editor...</span>
      </div>
    );
  }

  // Selected Provider Info
  const selectedProvider = providers.find((p) => p._id === product.providerId);

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-24">
      {/* Top Navigation & Sticky Action Bar */}
      <div className="bg-white rounded-3xl border-2 border-stone-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-4 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const returnUrl =
                (typeof window !== "undefined"
                  ? new URLSearchParams(window.location.search).get("returnUrl")
                  : null) || "/admin/products";
              router.push(returnUrl);
            }}
            className="w-10 h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                {product.canbosoProductId
                  ? "Connect Upstream"
                  : mode === "create"
                  ? "New Product"
                  : "Edit Product"}
              </span>
              {product.canbosoProductId && (
                <span className="badge bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-bold">
                  Upstream ID: {product.canbosoProductId}
                </span>
              )}
              {product.slug && (
                <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
                  /{product.slug}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight mt-0.5">
              {product.title || (mode === "create" ? "Create New Product" : "Untitled Product")}
            </h1>
          </div>
        </div>

        {/* Top Save & Cancel Actions */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            type="button"
            onClick={() => {
              const returnUrl =
                (typeof window !== "undefined"
                  ? new URLSearchParams(window.location.search).get("returnUrl")
                  : null) || "/admin/products";
              router.push(returnUrl);
            }}
            className="btn btn-sm bg-stone-100 hover:bg-stone-200 text-stone-700 border-none rounded-xl font-bold px-4 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-editor-form"
            disabled={submitting}
            className="btn btn-sm bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-black px-6 shadow-sm flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-xs text-stone-950"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{mode === "create" ? "Publish Product" : "Save Changes"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Form */}
      <form id="product-editor-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 Cols): Title, Slug, Description (HTML Editor), Media, Custom Fields */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Title & Slug */}
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              <span>General Information</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Product Title (পণ্যের নাম) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Canva Pro 1 Year Subscription"
                  className="input input-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 w-full text-sm font-bold"
                  value={product.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setProduct({
                      ...product,
                      title: newTitle,
                      slug: mode === "create" && !product.slug ? generateSlug(newTitle) : product.slug,
                    });
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. canva-pro-1-year"
                    className="input input-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 w-full text-xs font-mono"
                    value={product.slug}
                    onChange={(e) => setProduct({ ...product, slug: generateSlug(e.target.value) })}
                  />
                  <span className="text-[10px] text-stone-400 font-mono mt-1 block">
                    Storefront: /product/{product.slug || "slug"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Duration / Validity Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ১ বছর / Lifetime"
                    className="input input-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 w-full text-xs font-semibold"
                    value={product.duration || ""}
                    onChange={(e) => setProduct({ ...product, duration: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Rich HTML Editor for Description */}
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 shadow-xs space-y-4">
            <HtmlEditor
              value={product.description}
              onChange={(val) => setProduct({ ...product, description: val })}
              label="Product Description (বাংলা মার্কেটিং বর্ণনা)"
              placeholder="পণ্য পরিচিতি, সুবিধা ও ডেলিভারি বিবরণ লিখুন..."
              minHeight="350px"
              onGenerateAi={handleGenerateAiCopy}
              generatingAi={generatingAiCopy}
            />
          </div>

          {/* Card 3: Digital Delivery & Attachments */}
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-500" />
              <span>Digital Fulfillment & Customer Delivery</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Instant Delivery Link / Invite URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="input input-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 w-full text-xs font-mono"
                  value={product.deliveryLink || ""}
                  onChange={(e) => setProduct({ ...product, deliveryLink: e.target.value })}
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Automatically shown on receipt and sent via email upon payment.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Downloadable File Attachment
                </label>
                {product.filePath ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50/70 transition-all">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-stone-900 block truncate">
                          {product.filePath.split("/").pop()}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 font-semibold block truncate">
                          Attached: {product.filePath}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMediaPickerTarget("file");
                          setIsMediaPickerOpen(true);
                        }}
                        className="btn btn-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Change file from media storage"
                      >
                        <HardDrive className="w-3 h-3 text-amber-600" />
                        <span className="hidden sm:inline">Change</span>
                      </button>
                      <a
                        href={`${apiUrl}/${product.filePath.replace(/^\/+/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-xs text-stone-600 hover:text-stone-900 flex items-center gap-1"
                        title="Download or preview file"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">View</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(false)}
                        className="btn btn-xs bg-rose-100 hover:bg-rose-200 text-rose-800 border-none rounded-lg font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Delete and detach file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={(e) => handleFileUpload(e, false)}
                        className="file-input file-input-bordered file-input-sm w-full rounded-xl bg-stone-50 text-stone-900 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setMediaPickerTarget("file");
                          setIsMediaPickerOpen(true);
                        }}
                        className="btn btn-sm bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-xl font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                        title="Pick file from media storage"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-stone-600" />
                        <span>Storage</span>
                      </button>
                      {uploadingFile && <span className="loading loading-spinner loading-xs text-amber-500"></span>}
                    </div>
                    <span className="text-[10px] text-stone-400 block">
                      ZIP, PDF, licenses, or media files given to customers after payment.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Channels Checkboxes */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-warning checkbox-sm"
                  checked={product.isEmailDelivery}
                  onChange={(e) => setProduct({ ...product, isEmailDelivery: e.target.checked })}
                />
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Email Delivery</span>
                  <span className="text-[10px] text-stone-500 block">Sends access details directly to buyer email</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-warning checkbox-sm"
                  checked={product.isWebDisplay}
                  onChange={(e) => setProduct({ ...product, isWebDisplay: e.target.checked })}
                />
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Instant Web Receipt Display</span>
                  <span className="text-[10px] text-stone-500 block">Shows credentials immediately on receipt page</span>
                </div>
              </label>
            </div>
          </div>

          {/* Card 4: Required Customer Checkout Fields */}
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Required Checkout Inputs from Customer</span>
            </h3>
            <p className="text-xs text-stone-500">
              Select which information the customer must provide during checkout for this product:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {[
                { key: "email", label: "Customer Email Address" },
                { key: "whatsapp", label: "WhatsApp Number" },
                { key: "username", label: "User / Account Name" },
                { key: "password", label: "Password" },
                { key: "workspaceName", label: "Workspace / Organization" },
              ].map((f) => (
                <label
                  key={f.key}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-warning checkbox-xs"
                    checked={product.checkoutFields?.includes(f.key)}
                    onChange={() => toggleCheckoutField(f.key)}
                  />
                  <span className="text-xs font-bold text-stone-800">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Card 5: Course Curriculum (Optional) */}
          {(product.type === "course" || product.type === "video") && (
            <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Course Modules & Curriculum</span>
              </h3>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Lesson title..."
                  className="input input-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 text-xs flex-1"
                  value={curriculumTitle}
                  onChange={(e) => setCurriculumTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Duration (e.g. 15m)"
                  className="input input-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 text-xs sm:w-36"
                  value={curriculumDuration}
                  onChange={(e) => setCurriculumDuration(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddCurriculum}
                  className="btn btn-sm bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Lesson</span>
                </button>
              </div>

              {product.curriculum && product.curriculum.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {product.curriculum.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs"
                    >
                      <span className="font-bold text-stone-800">
                        {idx + 1}. {item.title} {item.duration ? `(${item.duration})` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCurriculum(idx)}
                        className="btn btn-ghost btn-xs text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (4 Cols): Pricing, Upstream Provider, Media, Placements */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Pricing & Type */}
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span>Pricing & Product Type</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Selling Price (৳ BDT) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 450"
                  className="input input-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 w-full text-base font-black pl-8"
                  value={product.price || ""}
                  onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) || 0 })}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-stone-400">৳</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Compare-at Price (৳ Strike)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 600"
                  className="input input-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 w-full text-sm font-bold pl-8"
                  value={product.compareAtPrice || ""}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      compareAtPrice: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">৳</span>
              </div>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                  Discount: ৳{product.compareAtPrice - product.price} (
                  {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF)
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Product Type
              </label>
              <select
                className="select select-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 w-full text-xs font-bold"
                value={product.type}
                onChange={(e) => setProduct({ ...product, type: e.target.value as any })}
              >
                <option value="account">Private Account (Instant Delivery)</option>
                <option value="slot">Team / Workspace Slot (Email Invite)</option>
                <option value="license">Software License Key</option>
                <option value="course">Video Course</option>
                <option value="pdf">PDF Book / Guide</option>
                <option value="video">Video Resource</option>
                <option value="zip">ZIP Archive</option>
                <option value="other">Other Digital Good</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Campaign Category *
              </label>
              <select
                className="select select-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 w-full text-xs font-bold"
                value={product.category || product.type || "account"}
                onChange={(e) => setProduct({ ...product, category: e.target.value })}
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
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Card 2: Upstream Supplier Routing */}
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-500" />
                <span>Upstream Provider Route</span>
              </h3>
              {product.canbosoProductId && (
                <span className="badge badge-ghost badge-sm text-[10px] font-mono">
                  ID: {product.canbosoProductId}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Fulfillment Supplier
              </label>
              <div className="space-y-2">
                <select
                  className="select select-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 w-full text-xs font-semibold"
                  value={product.providerId || ""}
                  onChange={(e) => {
                    const provId = e.target.value;
                    const prov = providers.find((p) => p._id === provId);
                    setProduct({
                      ...product,
                      providerId: provId || undefined,
                      providerName: prov?.name || undefined,
                    });
                  }}
                >
                  <option value="">Manual / Local Fulfillment (No API)</option>
                  {providers.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.isDefault ? "(Default)" : ""} {p.balanceUsd !== undefined ? `• $${Number(p.balanceUsd).toFixed(2)} USD` : ""}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={openCompareModal}
                  disabled={!product.title?.trim()}
                  className="btn btn-sm w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-2xs"
                  title="Compare price across all supplier catalogs with AI"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Compare Across Suppliers with AI</span>
                </button>
              </div>
            </div>

            {selectedProvider && (
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-stone-700">
                  <span>Exchange Rate:</span>
                  <span className="text-stone-900">$1 = ৳{selectedProvider.dollarRate || 127}</span>
                </div>
                {product.canbosoCostUsd && (
                  <div className="flex justify-between font-bold text-stone-700">
                    <span>Upstream Cost:</span>
                    <span className="text-stone-900">${product.canbosoCostUsd.toFixed(2)} USD (~৳{Math.round(product.canbosoCostUsd * (selectedProvider.dollarRate || 127))})</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 3: Product Thumbnail */}
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <span>Product Thumbnail</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setMediaPickerTarget("thumbnail");
                  setIsMediaPickerOpen(true);
                }}
                className="btn btn-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Browse existing images in media library"
              >
                <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                <span>Media Storage</span>
              </button>
            </div>

            {product.thumbnailPath ? (
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 p-2">
                <img
                  src={
                    product.thumbnailPath.startsWith("http")
                      ? product.thumbnailPath
                      : `${apiUrl}/${product.thumbnailPath.replace(/^\//, "")}`
                  }
                  alt={product.title}
                  className="w-full h-44 object-contain rounded-xl bg-white"
                />
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaPickerTarget("thumbnail");
                      setIsMediaPickerOpen(true);
                    }}
                    className="btn btn-xs bg-white/95 hover:bg-white text-stone-800 border border-stone-200 rounded-lg font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                    title="Change thumbnail from Media Storage"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                    <span>Change</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFile(true)}
                    className="btn btn-xs bg-rose-100 hover:bg-rose-200 text-rose-800 border-none rounded-lg font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                    title="Delete thumbnail image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-stone-200 rounded-2xl text-center bg-stone-50">
                <ImageIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <span className="text-xs text-stone-500 block mb-3 font-medium">Upload new or pick from storage</span>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaPickerTarget("thumbnail");
                      setIsMediaPickerOpen(true);
                    }}
                    className="btn btn-sm bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Browse Storage</span>
                  </button>
                  <label className="btn btn-sm bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingThumbnail ? "Uploading..." : "Upload New"}</span>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, true)}
                      disabled={uploadingThumbnail}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Storefront Visibility & Placements */}
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>Visibility & Placements</span>
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 bg-stone-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Published Status</span>
                  <span className="text-[10px] text-stone-500 block">Visible to customers in store catalog</span>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-success toggle-sm"
                  checked={product.active}
                  onChange={(e) => setProduct({ ...product, active: e.target.checked })}
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 bg-stone-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Top Compact Slider</span>
                  <span className="text-[10px] text-stone-500 block">Featured in the top hero slider</span>
                </div>
                <input
                  type="checkbox"
                  className="checkbox checkbox-warning checkbox-sm"
                  checked={product.showInSlider || false}
                  onChange={(e) => setProduct({ ...product, showInSlider: e.target.checked })}
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 bg-stone-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Featured Badge</span>
                  <span className="text-[10px] text-stone-500 block">Highlights product with golden badge</span>
                </div>
                <input
                  type="checkbox"
                  className="checkbox checkbox-warning checkbox-sm"
                  checked={product.isFeatured || false}
                  onChange={(e) => setProduct({ ...product, isFeatured: e.target.checked })}
                />
              </label>
            </div>
          </div>
        </div>
      </form>

      {/* AI Provider Comparison Modal */}
      <ProviderComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        product={comparisonProduct}
        onSelectProvider={(provId, provName, upId, costUsd) => {
          setProduct((prev) => ({
            ...prev,
            providerId: provId,
            providerName: provName,
            canbosoProductId: upId,
            canbosoCostUsd: costUsd,
          }));
        }}
      />

      {/* CMS Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        title={mediaPickerTarget === "thumbnail" ? "Select Product Thumbnail" : "Select Product Download Attachment"}
        filterType={mediaPickerTarget === "thumbnail" ? "image" : "all"}
        onSelect={(filePath) => {
          if (mediaPickerTarget === "thumbnail") {
            setProduct((prev) => ({ ...prev, thumbnailPath: filePath }));
          } else {
            setProduct((prev) => ({ ...prev, filePath }));
          }
        }}
      />
    </div>
  );
}
