"use client";

import { useEffect, useState } from "react";

const ProductsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const TransactionsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(`${apiUrl}/api/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [apiUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="alert alert-error">
        <span>Failed to load dashboard metrics. Check server status.</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-black text-base-content">Dashboard Overview</h1>
        <p className="text-xs text-base-content/65 font-semibold mt-1">General dashboard metrics and performance tracking</p>
      </div>

      {/* KPI Cards widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-base-100 p-6 border border-base-300 shadow-sm flex flex-col gap-2 rounded-2xl">
          <span className="text-xs text-base-content/60 font-bold uppercase tracking-wider">Total Sales</span>
          <span className="text-3xl font-black text-primary">৳{stats.totalSales}</span>
        </div>
        <div className="card bg-base-100 p-6 border border-base-300 shadow-sm flex flex-col gap-2 rounded-2xl">
          <span className="text-xs text-base-content/60 font-bold uppercase tracking-wider">Total Orders</span>
          <span className="text-3xl font-black text-base-content">{stats.totalOrders}</span>
        </div>
        <div className="card bg-base-100 p-6 border border-base-300 shadow-sm flex flex-col gap-2 rounded-2xl">
          <span className="text-xs text-base-content/60 font-bold uppercase tracking-wider">Paid Orders</span>
          <span className="text-3xl font-black text-emerald-600">{stats.paidOrders}</span>
        </div>
        <div className="card bg-base-100 p-6 border border-base-300 shadow-sm flex flex-col gap-2 rounded-2xl">
          <span className="text-xs text-base-content/60 font-bold uppercase tracking-wider">Pending Orders</span>
          <span className="text-3xl font-black text-amber-500">
            {stats.processingOrders + stats.pendingOrders}
          </span>
        </div>
      </div>

      {/* Tables details lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm">
          <h3 className="text-lg font-black text-base-content mb-4 flex items-center gap-2">
            <ProductsIcon /> Top Selling Products
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-sm">
              <thead>
                <tr className="border-b border-base-300 text-base-content/80 font-bold">
                  <th>Product Title</th>
                  <th className="text-center">Units Sold</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts && stats.topProducts.length > 0 ? (
                  stats.topProducts.map((p: any, idx: number) => (
                    <tr key={idx} className="border-b border-base-200">
                      <td className="font-bold text-base-content">{p.title}</td>
                      <td className="text-center font-bold text-base-content/85">{p.salesCount}</td>
                      <td className="text-right font-black text-primary">৳{p.revenue}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-base-content/50">No products sold yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm">
          <h3 className="text-lg font-black text-base-content mb-4 flex items-center gap-2">
            <TransactionsIcon /> Recent Transactions
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-sm">
              <thead>
                <tr className="border-b border-base-300 text-base-content/80 font-bold">
                  <th>TrxID</th>
                  <th>Gateway</th>
                  <th>Amount</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
                  stats.recentTransactions.map((t: any, idx: number) => (
                    <tr key={idx} className="border-b border-base-200">
                      <td className="font-mono font-bold text-base-content">{t.trxID}</td>
                      <td className="uppercase font-semibold text-xs">{t.gateway}</td>
                      <td className="font-bold text-base-content">৳{t.amount}</td>
                      <td className="text-center">
                        <span className={`badge badge-sm font-bold ${
                          t.status === "verified" ? "badge-success text-success-content" : t.status === "pending" ? "badge-warning text-stone-900" : "badge-error text-error-content"
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-base-content/50">No transaction logs available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
