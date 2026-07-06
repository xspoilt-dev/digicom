"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

// Custom Premium SVG Icons for Admin Dashboard
const DashboardIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ProductsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const OrdersIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const TransactionsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const RouterIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [tokenInput, setTokenInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const pathname = usePathname();

  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      localStorage.setItem("admin_token", tokenInput.trim());
      setIsAuthenticated(true);
      window.location.reload();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200" data-theme="lightyellow">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 px-4" data-theme="lightyellow">
        <div className="card w-full max-w-md bg-base-100 border border-base-300 shadow-xl rounded-3xl p-8">
          <h2 className="text-center font-black text-2xl text-base-content mb-6">
            Admin Security Gate
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold text-base-content/85">Administrator Secret Token</span>
              </label>
              <input
                type="password"
                required
                placeholder="Enter secret token"
                className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary w-full rounded-xl font-bold mt-4 shadow-lg">
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-base-200 text-base-content" data-theme="lightyellow">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-base-100 border-r border-base-300 flex flex-col p-6 shadow-md shrink-0">
        <div className="pb-6 border-b border-base-200 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-xl text-primary-content shadow-sm">
            L
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight text-base-content">Lumina Admin</div>
            <div className="text-[10px] text-base-content/60 font-semibold mt-[-3px]">Store Management</div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              pathname === "/admin/dashboard" || pathname === "/admin"
                ? "bg-primary text-primary-content shadow-sm"
                : "hover:bg-base-200 text-base-content/80"
            }`}
          >
            <DashboardIcon /> Overview
          </Link>
          <Link
            href="/admin/products"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              pathname === "/admin/products"
                ? "bg-primary text-primary-content shadow-sm"
                : "hover:bg-base-200 text-base-content/80"
            }`}
          >
            <ProductsIcon /> Catalog
          </Link>
          <Link
            href="/admin/orders"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              pathname === "/admin/orders"
                ? "bg-primary text-primary-content shadow-sm"
                : "hover:bg-base-200 text-base-content/80"
            }`}
          >
            <OrdersIcon /> Orders
          </Link>
          <Link
            href="/admin/transactions"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              pathname === "/admin/transactions"
                ? "bg-primary text-primary-content shadow-sm"
                : "hover:bg-base-200 text-base-content/80"
            }`}
          >
            <TransactionsIcon /> Ledger
          </Link>
          <Link
            href="/admin/redirects"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              pathname === "/admin/redirects"
                ? "bg-primary text-primary-content shadow-sm"
                : "hover:bg-base-200 text-base-content/80"
            }`}
          >
            <RouterIcon /> Router
          </Link>
          <Link
            href="/admin/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              pathname === "/admin/settings"
                ? "bg-primary text-primary-content shadow-sm"
                : "hover:bg-base-200 text-base-content/80"
            }`}
          >
            <SettingsIcon /> Configuration
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="btn btn-outline btn-error w-full rounded-xl font-bold mt-6"
        >
          Logout
        </button>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
