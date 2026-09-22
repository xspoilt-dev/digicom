"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle2,
  DollarSign,
  Package,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = getApiUrl();

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
      <div className="flex items-center justify-center p-16">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm font-semibold">
        Failed to load dashboard metrics. Check server status.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2.5">
          <LayoutDashboard className="w-7 h-7 text-amber-500" /> Dashboard Overview
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
          Store sales performance, completed fulfillments, and financial metrics
        </p>
      </div>

      {/* Financial Accounting KPI Cards (USD for Admin, BDT Context) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 border-2 border-stone-200 shadow-sm flex flex-col justify-between gap-3 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Total Sales (USD)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-stone-900">
              ${(stats.totalSalesUsd || (stats.totalSales / (stats.dollarRate || 127))).toFixed(2)}
            </div>
            <span className="text-xs font-semibold text-stone-500 mt-0.5 block">
              ৳{stats.totalSales} BDT
            </span>
          </div>
        </div>

        <div className="bg-white p-6 border-2 border-stone-200 shadow-sm flex flex-col justify-between gap-3 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Upstream Cost (USD)</span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-stone-900">
              ${(stats.totalCostUsd || 0).toFixed(2)}
            </div>
            <span className="text-xs font-semibold text-stone-500 mt-0.5 block">
              ~৳{Math.round((stats.totalCostUsd || 0) * (stats.dollarRate || 127))} BDT
            </span>
          </div>
        </div>

        <div className="bg-white p-6 border-2 border-stone-200 shadow-sm flex flex-col justify-between gap-3 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Net Profit (USD)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-600">
              ${(stats.netProfitUsd || 0).toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold text-stone-500">
                ~৳{Math.round((stats.netProfitUsd || 0) * (stats.dollarRate || 127))} BDT
              </span>
              <span className="badge bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                +{stats.profitMargin || "0.0"}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border-2 border-stone-200 shadow-sm flex flex-col justify-between gap-3 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Rate & Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-stone-900">
              {stats.paidOrders} / {stats.totalOrders} Paid
            </div>
            <span className="text-xs font-bold text-amber-600 mt-0.5 block">
              1 USD = ৳{stats.dollarRate || 127} BDT
            </span>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white border-2 border-stone-200 p-6 rounded-3xl shadow-sm">
          <h2 className="text-base font-black text-stone-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" /> Top Selling Products
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-stone-100">
            <table className="table w-full text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                  <th>Product</th>
                  <th className="text-center">Units Sold</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts && stats.topProducts.length > 0 ? (
                  stats.topProducts.map((p: any, idx: number) => (
                    <tr key={idx} className="border-b border-stone-100 hover:bg-stone-50/50">
                      <td className="font-bold text-stone-900">{p.title}</td>
                      <td className="text-center font-bold text-stone-700">{p.salesCount}</td>
                      <td className="text-right font-black text-amber-600">৳{p.revenue}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-stone-400 font-medium">
                      No products sold yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border-2 border-stone-200 p-6 rounded-3xl shadow-sm">
          <h2 className="text-base font-black text-stone-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" /> Recent Transactions
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-stone-100">
            <table className="table w-full text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                  <th>TrxID</th>
                  <th>Gateway</th>
                  <th>Amount</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
                  stats.recentTransactions.map((t: any, idx: number) => (
                    <tr key={idx} className="border-b border-stone-100 hover:bg-stone-50/50">
                      <td className="font-mono font-bold text-stone-900">{t.trxID}</td>
                      <td className="uppercase font-semibold text-[10px] text-stone-600">{t.gateway}</td>
                      <td className="font-bold text-stone-900">৳{t.amount}</td>
                      <td className="text-center">
                        <span
                          className={`badge badge-sm font-bold border-none ${
                            t.status === "verified"
                              ? "bg-emerald-500 text-white"
                              : t.status === "pending"
                              ? "bg-amber-400 text-stone-950"
                              : "bg-rose-500 text-white"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-stone-400 font-medium">
                      No transaction records found.
                    </td>
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
