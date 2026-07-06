"use client";

import { useEffect, useState } from "react";

interface Order {
  _id: string;
  orderId: string;
  name?: string;
  email?: string;
  phone?: string;
  total: number;
  status: "pending" | "processing" | "paid" | "failed" | "cancelled";
  paymentGateway: "bkash" | "eps";
  bkashSender?: string;
  bkashTrxID?: string;
  epsTransactionId?: string;
  createdAt: string;
}

const SearchIcon = () => (
  <svg className="w-4 h-4 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px", display: "inline-block" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchOrders();
  }, [apiUrl, orderFilter, orderSearch]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (orderFilter) params.append("status", orderFilter);
      if (orderSearch) params.append("search", orderSearch);
      const res = await fetch(`${apiUrl}/api/admin/orders?${params.toString()}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyOrder = async (id: string) => {
    if (!confirm("Are you sure you want to verify this transaction payment manually?")) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/orders/${id}/verify`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        alert("Payment verified successfully. Delivery links unlocked and Meta CAPI Purchase event fired!");
        fetchOrders();
      } else {
        alert(data.message || "Verification failed");
      }
    } catch (err) {
      alert("Error processing verification.");
    }
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/orders/${id}/cancel`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        alert("Order cancelled successfully.");
        fetchOrders();
      }
    } catch (err) {
      alert("Error processing order cancellation.");
    }
  };

  const orderStatusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "badge-warning text-stone-900" },
    processing: { label: "Verifying", color: "badge-primary text-primary-content" },
    paid: { label: "Paid", color: "badge-success text-success-content" },
    failed: { label: "Failed", color: "badge-error text-error-content" },
    cancelled: { label: "Cancelled", color: "badge-ghost" },
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-black text-base-content">Order Register</h1>
        <p className="text-xs text-base-content/65 font-semibold mt-1">Audit customer details, confirm manual transfers, and download keys</p>
      </div>

      {/* Filter and query search inputs */}
      <div className="flex flex-col sm:flex-row gap-4 bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm">
        <div className="form-control w-full sm:max-w-xs">
          <select
            className="select select-bordered focus:select-primary rounded-xl text-base-content bg-base-100"
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
          >
            <option value="">All Orders Status</option>
            <option value="pending">Pending Payment</option>
            <option value="processing">Verifying Transfer (bKash)</option>
            <option value="paid">Paid / Unlocked</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="form-control flex-1">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search by email, phone, TrxID, or Order ID..."
              className="input input-bordered w-full pr-10 focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
            />
            <span className="absolute right-3 opacity-60">
              <SearchIcon />
            </span>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full text-sm">
            <thead>
              <tr className="border-b border-base-300 text-base-content/80 font-bold">
                <th>Order ID</th>
                <th>Customer Profile</th>
                <th>Gateway</th>
                <th>Total</th>
                <th>bKash Info</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((o) => {
                  const stat = orderStatusLabels[o.status] || { label: o.status, color: "badge-ghost" };
                  return (
                    <tr key={o._id} className="border-b border-base-200">
                      <td className="font-mono font-bold text-base-content">{o.orderId}</td>
                      <td>
                        <div className="font-bold text-base-content">{o.name || "Guest User"}</div>
                        <div className="text-xs text-base-content/60">{o.email} | {o.phone}</div>
                      </td>
                      <td>
                        <span className="badge badge-sm font-bold uppercase">{o.paymentGateway}</span>
                      </td>
                      <td className="font-black text-primary">৳{o.total}</td>
                      <td>
                        {o.paymentGateway === "bkash" && o.bkashTrxID ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs bg-rose-50 text-rose-700 font-bold py-1 px-2 rounded border border-rose-100 max-w-fit">
                              {o.bkashTrxID}
                            </span>
                            <span className="text-[10px] text-base-content/50">Sender: {o.bkashSender}</span>
                          </div>
                        ) : o.epsTransactionId ? (
                          <span className="font-mono text-xs font-semibold">{o.epsTransactionId}</span>
                        ) : (
                          <span className="text-base-content/40 italic text-xs">None</span>
                        )}
                      </td>
                      <td className="text-xs text-base-content/70">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`badge badge-sm font-bold ${stat.color}`}>
                          {stat.label}
                        </span>
                      </td>
                      <td className="text-right">
                        {o.status === "processing" && (
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => verifyOrder(o._id)} className="btn btn-xs btn-primary rounded-full px-3 font-bold">
                              Approve
                            </button>
                            <button
                              onClick={() => cancelOrder(o._id)}
                              className="btn btn-xs btn-outline btn-error rounded-full px-3 font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-base-content/50">No orders found matching parameters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
