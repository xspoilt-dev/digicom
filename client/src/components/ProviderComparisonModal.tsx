"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getApiUrl } from "@/lib/api";
import { useModal } from "@/context/ModalContext";
import FormattedDescription from "@/components/FormattedDescription";
import {
  Sparkles,
  Server,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Zap,
  ArrowRight,
  TrendingUp,
  Package,
} from "lucide-react";

export interface ComparisonProductParam {
  title: string;
  code?: string;
  priceBdt?: number;
  productId?: string;
  currentProviderId?: string;
  currentProviderName?: string;
  upstreamProductId?: string;
}

export interface ProviderComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ComparisonProductParam | null;
  onAssignSuccess?: () => void;
  onSelectProvider?: (providerId: string, providerName: string, upstreamProductId?: string, costUsd?: number) => void;
}

export interface ProviderComparisonQuote {
  providerId: string;
  providerName: string;
  dollarRate: number;
  upstreamProductId: string;
  upstreamProductName: string;
  upstreamCode?: string;
  costUsd: number;
  costBdt: number;
  stock: number;
  autoFulfill: boolean;
  isCurrent: boolean;
  isCheapest: boolean;
}

export interface ProviderComparisonResponse {
  success: boolean;
  productName: string;
  cheapestProviderId: string;
  cheapestProviderName: string;
  cheapestCostUsd: number;
  cheapestCostBdt: number;
  savingsUsd: number;
  savingsBdt: number;
  comparisons: ProviderComparisonQuote[];
  verdict: string;
  analysisHtml: string;
  recommendation: string;
  modelUsed: string;
  message?: string;
}

export default function ProviderComparisonModal({
  isOpen,
  onClose,
  product,
  onAssignSuccess,
  onSelectProvider,
}: ProviderComparisonModalProps) {
  const { showAlert } = useModal();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assigningProviderId, setAssigningProviderId] = useState<string | null>(null);
  const [data, setData] = useState<ProviderComparisonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = getApiUrl();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const runComparison = async () => {
    if (!product || !product.title) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`${apiUrl}/api/admin/products/compare-providers`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productName: product.title,
          code: product.code,
          priceBdt: product.priceBdt,
          currentProviderId: product.currentProviderId,
          productId: product.productId,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      } else {
        setError(resData.message || "Failed to compare product across providers.");
      }
    } catch (err: any) {
      setError(err.message || "Network error querying providers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      runComparison();
    }
  }, [isOpen, product?.title]);

  const handleAssignProvider = async (quote: ProviderComparisonQuote) => {
    if (!product?.productId) {
      if (onSelectProvider) {
        onSelectProvider(quote.providerId, quote.providerName, quote.upstreamProductId, quote.costUsd);
      }
      onClose();
      return;
    }

    setAssigningProviderId(quote.providerId);
    try {
      const res = await fetch(`${apiUrl}/api/admin/products/${product.productId}/assign-provider`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          providerId: quote.providerId,
          upstreamProductId: quote.upstreamProductId,
          costUsd: quote.costUsd,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        if (onSelectProvider) {
          onSelectProvider(quote.providerId, quote.providerName, quote.upstreamProductId, quote.costUsd);
        }
        await showAlert({
          title: "Provider Assigned",
          message: `Product is now successfully routed to "${quote.providerName}". Automated fulfillment will use this supplier's API key.`,
          type: "success",
        });
        if (onAssignSuccess) onAssignSuccess();
        onClose();
      } else {
        await showAlert({
          title: "Error",
          message: resData.message || "Failed to switch provider.",
          type: "error",
        });
      }
    } catch (err: any) {
      await showAlert({
        title: "Error",
        message: err.message || "Network error.",
        type: "error",
      });
    } finally {
      setAssigningProviderId(null);
    }
  };

  if (!mounted || !isOpen || !product) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-stone-950/75 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl border-2 border-stone-200 shadow-2xl text-stone-900 my-auto max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-stone-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-lg sm:text-xl text-stone-900">
                  AI Multi-Provider Price Compare
                </h3>
                <span className="badge bg-amber-400 text-stone-950 font-black text-[10px] border-none">
                  Smart Procurement
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Analyzing quotes for: <span className="font-bold text-stone-800">{product.title}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost btn-circle text-stone-400 hover:text-stone-700 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-xs">
          {/* Loading State */}
          {loading && (
            <div className="py-16 text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin mx-auto"></div>
                <Sparkles className="w-6 h-6 text-amber-500 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <h4 className="font-black text-base text-stone-900">AI Scanning Upstream Suppliers...</h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                  Querying live catalogs, comparing USD costs, calculating custom BDT exchange rates, and evaluating profit margins.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Unable to Compare Suppliers</span>
              </div>
              <p className="text-xs text-rose-700">{error}</p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={runComparison}
                  className="btn btn-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg border-none font-bold"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Try Again
                </button>
              </div>
            </div>
          )}

          {/* Comparison Results */}
          {!loading && data && data.comparisons && (
            <div className="space-y-6">
              {/* Executive Verdict Callout */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-emerald-500/10 border-2 border-amber-300 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-black text-stone-900 text-sm flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                    AI Price Verdict &amp; Cost Winner
                  </span>
                  {data.modelUsed && (
                    <span className="badge badge-ghost badge-sm text-[10px] font-mono text-stone-500">
                      AI Model: {data.modelUsed}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-amber-200/80 text-stone-900 font-bold text-xs sm:text-sm leading-relaxed shadow-2xs">
                  {data.verdict}
                </div>

                {data.savingsBdt > 0 && (
                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <div className="bg-emerald-50 text-emerald-800 font-black px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                      <span>Max Savings:</span>
                      <span>৳{data.savingsBdt} BDT</span>
                      <span className="text-[11px] font-mono font-normal">(${data.savingsUsd.toFixed(2)} USD)</span>
                    </div>
                    <span className="text-[11px] text-stone-600">
                      Cheapest Supplier: <strong className="text-stone-900">{data.cheapestProviderName}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Side-by-Side Supplier Cards Grid */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-stone-900 uppercase tracking-wider text-xs">
                    Supplier Quotes ({data.comparisons.length} Found)
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Sorted by lowest cost
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.comparisons.map((c) => {
                    const priceBdt = product.priceBdt || 0;
                    const profitBdt = priceBdt > c.costBdt ? priceBdt - c.costBdt : 0;
                    const profitPct = priceBdt > 0 ? ((profitBdt / priceBdt) * 100).toFixed(1) : "0";

                    return (
                      <div
                        key={c.providerId}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${
                          c.isCheapest
                            ? "bg-emerald-50/50 border-emerald-400 shadow-sm"
                            : c.isCurrent
                            ? "bg-amber-50/40 border-amber-300"
                            : "bg-stone-50/80 border-stone-200"
                        }`}
                      >
                        {/* Card Top */}
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-black text-sm text-stone-900">{c.providerName}</h4>
                                {c.isCheapest && (
                                  <span className="badge bg-emerald-500 text-white font-black text-[10px] border-none">
                                    🏆 CHEAPEST
                                  </span>
                                )}
                                {c.isCurrent && (
                                  <span className="badge bg-stone-900 text-white font-bold text-[10px] border-none">
                                    Current
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-stone-500 line-clamp-1 mt-0.5" title={c.upstreamProductName}>
                                {c.upstreamProductName}
                              </span>
                            </div>

                            <span
                              className={`badge badge-sm font-bold text-[10px] ${
                                c.stock > 0
                                  ? "bg-emerald-100 text-emerald-800 border-none"
                                  : "bg-rose-100 text-rose-800 border-none"
                              }`}
                            >
                              {c.stock > 0 ? `${c.stock} in stock` : "Out of stock"}
                            </span>
                          </div>

                          {/* Pricing Details */}
                          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                            <div className="bg-white p-2 rounded-xl border border-stone-200/80">
                              <span className="text-[10px] text-stone-400 uppercase font-bold block">
                                Cost (USD)
                              </span>
                              <span className="font-black text-stone-900 text-sm font-mono block">
                                ${c.costUsd.toFixed(2)}
                              </span>
                              <span className="text-[9px] text-stone-400 block font-mono">
                                Rate: ৳{c.dollarRate}
                              </span>
                            </div>

                            <div className="bg-white p-2 rounded-xl border border-stone-200/80">
                              <span className="text-[10px] text-stone-400 uppercase font-bold block">
                                Cost (BDT)
                              </span>
                              <span className="font-black text-amber-600 text-sm font-mono block">
                                ৳{c.costBdt}
                              </span>
                              {priceBdt > 0 ? (
                                <span className="text-[9px] text-emerald-600 font-bold block">
                                  +৳{profitBdt} ({profitPct}%)
                                </span>
                              ) : (
                                <span className="text-[9px] text-stone-400 block">Taka Cost</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-2 border-t border-stone-200/70">
                          {c.isCurrent ? (
                            <button
                              type="button"
                              disabled
                              className="btn btn-sm w-full rounded-xl font-bold text-xs bg-stone-200 text-stone-600 border-none cursor-not-allowed"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Currently Connected</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={assigningProviderId === c.providerId || c.stock <= 0}
                              onClick={() => handleAssignProvider(c)}
                              className={`btn btn-sm w-full rounded-xl font-bold text-xs border-none shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                                c.isCheapest
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "bg-stone-900 hover:bg-stone-800 text-white"
                              }`}
                            >
                              {assigningProviderId === c.providerId ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <Zap className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {onSelectProvider
                                  ? `Use ${c.providerName}`
                                  : product.productId
                                  ? `Route to ${c.providerName}`
                                  : `Select ${c.providerName}`}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Full Semantic AI Analysis & Strategic Advice */}
              {data.analysisHtml && (
                <div className="space-y-2">
                  <span className="font-extrabold text-stone-900 uppercase tracking-wider text-xs block">
                    AI Strategic Procurement Report
                  </span>
                  <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white p-1">
                    <FormattedDescription content={data.analysisHtml} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-stone-100 bg-stone-50/70 shrink-0">
          <button
            type="button"
            onClick={runComparison}
            disabled={loading}
            className="btn btn-ghost btn-sm rounded-xl font-bold text-stone-600 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Re-Check Rates</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn bg-stone-900 hover:bg-stone-800 text-white btn-sm rounded-xl px-5 font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
