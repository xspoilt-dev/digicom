"use client";

import { useEffect, useState } from "react";
import { useModal } from "@/context/ModalContext";
import { getApiUrl } from "@/lib/api";
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  User,
  Phone,
  Mail,
  Server,
  Zap,
  RefreshCw,
} from "lucide-react";

interface OrderItem {
  productId?: any;
  title: string;
  price: number;
  quantity: number;
  providerId?: string;
  providerName?: string;
  upstreamProductId?: string;
  upstreamOrderCode?: string;
}

interface DeliveryAccount {
  user?: string;
  password?: string;
  verifyEmail?: string;
  expiryText?: string;
  otherInfo?: string;
}

interface Order {
  _id: string;
  orderId: string;
  name?: string;
  email?: string;
  phone?: string;
  items?: OrderItem[];
  total: number;
  status: "pending" | "processing" | "paid" | "failed" | "cancelled";
  paymentGateway: string;
  zinipayInvoiceId?: string;
  zinipayPaymentUrl?: string;
  transactionId?: string;
  paymentMethod?: string;
  bkashSender?: string;
  bkashTrxID?: string;
  costUsd?: number;
  costBdt?: number;
  totalUsd?: number;
  profitUsd?: number;
  profitBdt?: number;
  dollarRateUsed?: number;
  fulfillmentStatus?: "pending" | "fulfilled" | "failed" | "manual" | "not_required";
  fulfillmentError?: string;
  providerId?: string;
  providerName?: string;
  canbosoOrderCode?: string;
  upstreamOrderCode?: string;
  deliveryAccounts?: DeliveryAccount[];
  slotMonths?: number;
  createdAt: string;
}

interface ProviderOption {
  _id: string;
  name: string;
  dollarRate?: number;
  isDefault?: boolean;
}

export default function OrdersPage() {
  const { showAlert, showConfirm } = useModal();
  const [orders, setOrders] = useState<Order[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [orderFilter, setOrderFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [fulfillingOrderId, setFulfillingOrderId] = useState<string | null>(null);
  const [overrideProviderId, setOverrideProviderId] = useState<string>("");

  const apiUrl = getApiUrl();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/providers`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.providers)) {
        setProviders(data.providers);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    try {
      let url = `${apiUrl}/api/admin/orders`;
      const params = new URLSearchParams();
      if (orderFilter) params.append("status", orderFilter);
      if (providerFilter) params.append("providerId", providerFilter);
      if (orderSearch) params.append("search", orderSearch);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [apiUrl]);

  useEffect(() => {
    fetchOrders();
  }, [apiUrl, orderFilter, providerFilter, orderSearch]);

  const verifyOrder = async (id: string) => {
    const confirmed = await showConfirm({
      title: "Approve Order",
      message: "Are you sure you want to approve this order? This will mark it as Paid, record the transaction, send the digital delivery email, and dispatch the Meta CAPI Purchase event.",
      type: "warning",
      confirmText: "Approve Order",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${apiUrl}/api/admin/orders/${id}/verify`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        await showAlert({
          title: "Order Approved",
          message: data.message || "Order approved. Delivery email sent and Meta CAPI Purchase event recorded.",
          type: "success",
        });
        fetchOrders();
      } else {
        await showAlert({
          title: "Verification Failed",
          message: data.message || "Verification failed.",
          type: "error",
        });
      }
    } catch (err) {
      await showAlert({
        title: "Error",
        message: "Error processing verification.",
        type: "error",
      });
    }
  };

  const cancelOrder = async (id: string) => {
    const confirmed = await showConfirm({
      title: "Cancel Order",
      message: "Are you sure you want to cancel this order?",
      type: "warning",
      confirmText: "Cancel Order",
      isDestructive: true,
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${apiUrl}/api/admin/orders/${id}/cancel`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        await showAlert({
          title: "Order Cancelled",
          message: "Order marked as cancelled.",
          type: "success",
        });
        fetchOrders();
      } else {
        await showAlert({
          title: "Error",
          message: data.message || "Failed to cancel order.",
          type: "error",
        });
      }
    } catch (err) {
      await showAlert({
        title: "Error",
        message: "Error processing cancellation.",
        type: "error",
      });
    }
  };

  const handleFulfillOrder = async (id: string, providerIdOverride?: string) => {
    setFulfillingOrderId(id);
    try {
      const res = await fetch(`${apiUrl}/api/admin/orders/${id}/fulfill`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ providerId: providerIdOverride || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        await showAlert({
          title: "Order Fulfilled",
          message: data.message || "Fulfillment completed and digital credentials secured!",
          type: "success",
        });
        fetchOrders();
        setSelectedOrderDetails(null);
      } else {
        await showAlert({
          title: "Fulfillment Failed",
          message: data.message || "Failed to fulfill with provider.",
          type: "error",
        });
      }
    } catch (err: any) {
      await showAlert({
        title: "Error",
        message: err.message || "Network error processing fulfillment.",
        type: "error",
      });
    } finally {
      setFulfillingOrderId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [showModalPasswords, setShowModalPasswords] = useState<Record<number, boolean>>({});

  const statusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="badge bg-emerald-500 text-white font-bold text-xs border-none">Paid</span>;
      case "processing":
        return <span className="badge bg-amber-400 text-stone-950 font-bold text-xs border-none">Verifying</span>;
      case "pending":
        return <span className="badge bg-stone-200 text-stone-800 font-bold text-xs border-none">Pending</span>;
      case "cancelled":
        return <span className="badge bg-stone-100 text-stone-500 font-bold text-xs border-none">Cancelled</span>;
      case "failed":
        return <span className="badge bg-rose-500 text-white font-bold text-xs border-none">Failed</span>;
      default:
        return <span className="badge badge-ghost font-bold text-xs">{status}</span>;
    }
  };

  const fulfillmentBadge = (status?: string) => {
    switch (status) {
      case "fulfilled":
        return <span className="badge bg-emerald-100 text-emerald-800 font-bold text-[10px] border-none">Fulfilled</span>;
      case "failed":
        return <span className="badge bg-rose-100 text-rose-800 font-bold text-[10px] border-none">Fulfill Failed</span>;
      case "pending":
        return <span className="badge bg-amber-100 text-amber-800 font-bold text-[10px] border-none">Fulfill Pending</span>;
      case "manual":
        return <span className="badge bg-blue-100 text-blue-800 font-bold text-[10px] border-none">Manual</span>;
      default:
        return <span className="badge bg-stone-100 text-stone-500 font-bold text-[10px] border-none">Standard</span>;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center p-16">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2.5">
          <ShoppingBag className="w-7 h-7 text-amber-500" /> Order Register
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
          Review customer checkouts, confirm payments, unlock digital assets, and monitor CAPI event dispatches
        </p>
      </div>

      {/* Filter and query search bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-5 rounded-2xl border-2 border-stone-200 shadow-sm">
        <div className="form-control w-full sm:max-w-xs">
          <select
            className="select select-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 font-semibold text-sm"
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
          >
            <option value="">All Order Statuses</option>
            <option value="pending">Pending Payment</option>
            <option value="processing">Verifying Transfer (bKash)</option>
            <option value="paid">Paid & Fulfilled</option>
            <option value="failed">Failed Payment</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Provider Filter */}
        <div className="form-control w-full sm:max-w-xs">
          <select
            className="select select-bordered focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 font-semibold text-sm"
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
          >
            <option value="">All Providers</option>
            {providers.map((p) => (
              <option key={p._id} value={p._id}>
                Provider: {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control flex-1">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search by Order ID (e.g. DIGI-1001), phone, email, provider, or TrxID..."
              className="input input-bordered w-full pr-10 focus:border-amber-400 rounded-xl text-stone-900 bg-stone-50 text-sm"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
            />
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold text-xs">
                <th>Order ID</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Revenue & Cost ($)</th>
                <th>Profit ($)</th>
                <th>Provider &amp; Fulfill</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((o) => {
                  const rate = o.dollarRateUsed || 127;
                  const sellUsd = o.totalUsd || Number((o.total / rate).toFixed(2));
                  const costUsd = o.costUsd || 0;
                  const profitUsd = o.profitUsd !== undefined ? o.profitUsd : Number((sellUsd - costUsd).toFixed(2));

                  return (
                    <tr key={o._id} className="border-b border-stone-100 hover:bg-stone-50/50">
                      <td className="font-mono font-bold text-stone-900 text-sm">
                        {o.orderId}
                      </td>
                      <td>
                        <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                          <User className="w-3 h-3 text-stone-400" />
                          <span>{o.name || "Customer"}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {o.phone && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(o.phone!, `phone-${o._id}`)}
                              className="text-[11px] font-mono text-stone-600 hover:text-amber-600 flex items-center gap-1 bg-stone-100 px-1.5 py-0.5 rounded"
                              title="Copy phone"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>{o.phone}</span>
                              {copiedId === `phone-${o._id}` ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-stone-400" />}
                            </button>
                          )}
                          {o.email && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(o.email!, `email-${o._id}`)}
                              className="text-[11px] text-stone-500 hover:text-amber-600 flex items-center gap-1 truncate max-w-[130px]"
                              title="Copy email"
                            >
                              <Mail className="w-2.5 h-2.5" />
                              <span className="truncate">{o.email}</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-stone-100 text-stone-700 font-bold text-[10px] border border-stone-200 uppercase mb-1">
                          {o.paymentGateway || "zinipay"}
                        </span>
                        {o.bkashTrxID ? (
                          <div className="font-mono text-[10px] bg-rose-50 text-rose-700 font-bold px-1.5 py-0.5 rounded border border-rose-100 max-w-fit mt-0.5">
                            Trx: {o.bkashTrxID}
                          </div>
                        ) : o.transactionId ? (
                          <div className="font-mono text-[10px] text-amber-700 font-bold mt-0.5">
                            Trx: {o.transactionId}
                          </div>
                        ) : (
                          <div className="text-[10px] text-stone-400 italic">No transaction id</div>
                        )}
                      </td>
                      <td>
                        <div className="font-black text-stone-900 text-xs">
                          ${sellUsd.toFixed(2)} USD
                        </div>
                        <div className="text-[11px] text-stone-500 font-semibold">
                          ৳{o.total} BDT
                        </div>
                        {costUsd > 0 && (
                          <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                            Cost: ${costUsd.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-md inline-block ${
                            profitUsd >= 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          ${profitUsd.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <div className="space-y-1">
                          {fulfillmentBadge(o.fulfillmentStatus)}
                          {o.providerName ? (
                            <span className="badge bg-amber-50 text-amber-900 border border-amber-200 text-[9px] font-bold block max-w-fit truncate">
                              {o.providerName}
                            </span>
                          ) : o.canbosoOrderCode ? (
                            <span className="badge bg-amber-50 text-amber-900 border border-amber-200 text-[9px] font-bold block max-w-fit truncate">
                              Canboso
                            </span>
                          ) : null}
                          {(o.upstreamOrderCode || o.canbosoOrderCode) && (
                            <div className="font-mono text-[10px] text-stone-500 truncate max-w-[110px]" title={o.upstreamOrderCode || o.canbosoOrderCode}>
                              #{o.upstreamOrderCode || o.canbosoOrderCode}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{statusBadge(o.status)}</td>
                      <td className="text-stone-500 whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(o)}
                            className="btn btn-xs bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg border-none font-bold px-2"
                            title="View order details and credentials"
                          >
                            Details
                          </button>
                          {o.status === "pending" || o.status === "processing" ? (
                            <>
                              <button
                                onClick={() => verifyOrder(o._id)}
                                className="btn btn-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg border-none font-bold shadow-xs px-2.5"
                                title="Approve order, trigger Canboso fulfillment, send email, and fire CAPI Purchase"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => cancelOrder(o._id)}
                                className="btn btn-xs bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border-none font-bold px-2"
                                title="Cancel order"
                              >
                                Cancel
                              </button>
                            </>
                          ) : null}
                          <a
                            href={`/receipt/${o.orderId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-xs btn-ghost text-stone-600 hover:text-stone-900 font-bold p-1"
                            title="View customer receipt"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-stone-400 font-medium">
                    No orders found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Items & Accounting Details Modal */}
      {selectedOrderDetails && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl max-w-2xl bg-white border border-stone-200 shadow-2xl p-6 sm:p-8 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <div>
                <h3 className="font-black text-lg text-stone-900">
                  Order #{selectedOrderDetails.orderId}
                </h3>
                <span className="text-xs text-stone-500">
                  Customer: {selectedOrderDetails.name} ({selectedOrderDetails.phone || selectedOrderDetails.email})
                </span>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Provider Connection Banner */}
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                      Connected Upstream Provider
                    </span>
                    <span className="font-bold text-stone-900 text-xs">
                      {selectedOrderDetails.providerName || (selectedOrderDetails.canbosoOrderCode ? "Canboso Primary" : "Manual / Local Fulfillment")}
                    </span>
                  </div>
                </div>

                {(selectedOrderDetails.upstreamOrderCode || selectedOrderDetails.canbosoOrderCode) && (
                  <div className="font-mono text-xs text-stone-700 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                    Upstream Order: <span className="font-bold">#{selectedOrderDetails.upstreamOrderCode || selectedOrderDetails.canbosoOrderCode}</span>
                  </div>
                )}
              </div>

              {/* Financial Accounting Breakdown (Admin USD View) */}
              <div className="bg-stone-50/80 border border-stone-200 rounded-2xl p-4">
                <span className="font-bold text-stone-800 text-xs block mb-2 uppercase tracking-wide">
                  Financial Ledger (Admin USD Accounting)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Selling Price</span>
                    <span className="font-black text-stone-900 text-sm">
                      ${(selectedOrderDetails.totalUsd || (selectedOrderDetails.total / (selectedOrderDetails.dollarRateUsed || 127))).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-stone-400 block">৳{selectedOrderDetails.total} BDT</span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Purchase Cost</span>
                    <span className="font-black text-stone-900 text-sm">
                      ${(selectedOrderDetails.costUsd || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-stone-400 block">~৳{selectedOrderDetails.costBdt || 0} BDT</span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Net Profit</span>
                    <span className="font-black text-emerald-600 text-sm">
                      ${(selectedOrderDetails.profitUsd || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-stone-400 block">~৳{selectedOrderDetails.profitBdt || 0} BDT</span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Dollar Rate</span>
                    <span className="font-black text-stone-800 text-sm">
                      ৳{selectedOrderDetails.dollarRateUsed || 127}
                    </span>
                    <span className="text-[10px] text-stone-400 block">per 1 USD</span>
                  </div>
                </div>
              </div>

              {/* Upstream Provider Credentials (If Fulfilled) */}
              {selectedOrderDetails.deliveryAccounts && selectedOrderDetails.deliveryAccounts.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-stone-800 block text-xs">
                    Delivered Digital Accounts ({selectedOrderDetails.deliveryAccounts.length}):
                  </span>
                  {selectedOrderDetails.canbosoOrderCode && (
                    <div className="text-[11px] font-mono text-stone-500">
                      Canboso Order Code: <span className="font-bold text-stone-800">{selectedOrderDetails.canbosoOrderCode}</span>
                    </div>
                  )}
                  {selectedOrderDetails.deliveryAccounts.map((acc, idx) => (
                    <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 font-mono text-[11px]">
                      {acc.user && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">User / Email:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900">{acc.user}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(acc.user!, `acc-user-${idx}`)}
                              className="btn btn-ghost btn-xs p-1"
                            >
                              {copiedId === `acc-user-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-stone-400" />}
                            </button>
                          </div>
                        </div>
                      )}
                      {acc.password && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Password:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900">
                              {showModalPasswords[idx] ? acc.password : "••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setShowModalPasswords((prev) => ({ ...prev, [idx]: !prev[idx] }))
                              }
                              className="btn btn-ghost btn-xs p-1"
                            >
                              {showModalPasswords[idx] ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(acc.password!, `acc-pw-${idx}`)}
                              className="btn btn-ghost btn-xs p-1"
                            >
                              {copiedId === `acc-pw-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-stone-400" />}
                            </button>
                          </div>
                        </div>
                      )}
                      {acc.verifyEmail && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Verify Email:</span>
                          <span className="font-bold text-stone-700">{acc.verifyEmail}</span>
                        </div>
                      )}
                      {acc.expiryText && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Validity:</span>
                          <span className="font-bold text-emerald-600">{acc.expiryText}</span>
                        </div>
                      )}
                      {acc.otherInfo && (
                        <div className="pt-1 border-t border-stone-200 text-stone-600 text-[10px]">
                          Note: {acc.otherInfo}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Fulfillment Error Notice if any */}
              {selectedOrderDetails.fulfillmentError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium text-xs">
                  Fulfillment Error: {selectedOrderDetails.fulfillmentError}
                </div>
              )}

              {/* Manual / Retry Fulfillment Controls */}
              {selectedOrderDetails.fulfillmentStatus !== "fulfilled" && (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Fulfill with Upstream Provider
                    </span>
                    <span className="text-[10px] text-stone-500 font-semibold uppercase">
                      Status: {selectedOrderDetails.fulfillmentStatus || "pending"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      className="select select-bordered select-xs rounded-lg font-bold text-xs bg-white text-stone-900 flex-1 border-stone-200"
                      value={overrideProviderId}
                      onChange={(e) => setOverrideProviderId(e.target.value)}
                    >
                      <option value="">Use Connected / Default Provider</option>
                      {providers.map((p) => (
                        <option key={p._id} value={p._id}>
                          Route to: {p.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={fulfillingOrderId === selectedOrderDetails._id}
                      onClick={() => handleFulfillOrder(selectedOrderDetails._id, overrideProviderId || undefined)}
                      className="btn btn-xs bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold rounded-lg border-none shadow-xs px-3 cursor-pointer"
                    >
                      {fulfillingOrderId === selectedOrderDetails._id ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                      <span>{fulfillingOrderId === selectedOrderDetails._id ? "Fulfilling..." : "Fulfill Now"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Ordered Products List */}
              <div className="space-y-2">
                <span className="font-bold text-stone-700 block">Ordered Items:</span>
                {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                  selectedOrderDetails.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100"
                    >
                      <div>
                        <div className="font-bold text-stone-900">{item.title}</div>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5 flex-wrap">
                          <span>Qty: {item.quantity}</span>
                          {item.providerName && (
                            <span className="badge bg-amber-100 text-amber-900 border-none text-[9px] font-bold">
                              Provider: {item.providerName}
                            </span>
                          )}
                          {item.upstreamOrderCode && (
                            <span className="font-mono text-[10px]">
                              Order #{item.upstreamOrderCode}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-amber-600">৳{item.price * item.quantity}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-stone-50 rounded-xl text-stone-500 italic">
                    Single Product Checkout: Total ৳{selectedOrderDetails.total}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-action mt-6 flex justify-between items-center">
              <a
                href={`/receipt/${selectedOrderDetails.orderId}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline rounded-xl font-bold flex items-center gap-1.5"
              >
                <span>View Receipt</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="btn btn-sm bg-stone-900 text-white rounded-xl px-5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
