"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

// Custom Premium SVG Icons for Admin Dashboard
const DashboardIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ProductsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const OrdersIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const TransactionsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const RouterIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-5 h-5 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<{ email?: string; name?: string; role?: string } | null>(null);
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>("");
  const [submittingLogin, setSubmittingLogin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const pathname = usePathname();
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Check saved session on mount
  useEffect(() => {
    async function verifySession() {
      const savedToken = localStorage.getItem("admin_token");
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/api/admin/me`, {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setIsAuthenticated(true);
          setAdminUser(data.user);
        } else {
          localStorage.removeItem("admin_token");
          setIsAuthenticated(false);
        }
      } catch (err) {
        // Fallback: if offline or network issue, keep token if exists
        setIsAuthenticated(true);
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
  }, [apiUrl]);

  // Close mobile menu on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setSubmittingLogin(true);

    try {
      const res = await fetch(`${apiUrl}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem("admin_token", data.token);
        setAdminUser(data.user);
        setIsAuthenticated(true);
        if (pathname === "/admin") {
          router.push("/admin/dashboard");
        }
      } else {
        setLoginError(data.message || "Invalid administrator credentials.");
      }
    } catch (err) {
      setLoginError("Failed to communicate with the authentication server.");
    } finally {
      setSubmittingLogin(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200" data-theme="lightyellow">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <span className="text-sm font-bold text-base-content/70">Authenticating session...</span>
        </div>
      </div>
    );
  }

  // Professional Email & Password Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-12" data-theme="lightyellow">
        <div className="card w-full max-w-md bg-base-100 border border-base-300 shadow-2xl rounded-3xl p-6 sm:p-10">
          
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center font-black text-2xl text-primary-content shadow-md mx-auto mb-4">
              D
            </div>
            <h1 className="text-2xl font-black text-base-content tracking-tight">
              Admin Portal
            </h1>
            <p className="text-xs text-base-content/60 mt-1 font-medium">
              Digitalcorebd store management & control center
            </p>
          </div>

          {loginError && (
            <div className="alert alert-error text-xs font-bold py-3 mb-6 rounded-2xl shadow-xs">
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold text-xs md:text-sm text-base-content/85">Admin Email</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="admin@digitalcorebd.com"
                  className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full pl-10 text-sm"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                <span className="absolute left-3.5">
                  <MailIcon />
                </span>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold text-xs md:text-sm text-base-content/85">Password</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full pl-10 pr-10 text-sm"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                />
                <span className="absolute left-3.5">
                  <LockIcon />
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-ghost btn-xs btn-circle absolute right-2 text-base-content/50"
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingLogin}
              className="btn btn-primary w-full rounded-xl font-bold mt-4 shadow-lg text-sm"
            >
              {submittingLogin ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Signing In...
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-base-200 text-center">
            <Link href="/" className="text-xs font-bold text-base-content/60 hover:text-primary transition-colors">
              ← Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: "/admin/dashboard", label: "Overview", icon: <DashboardIcon /> },
    { href: "/admin/products", label: "Catalog", icon: <ProductsIcon /> },
    { href: "/admin/orders", label: "Orders", icon: <OrdersIcon /> },
    { href: "/admin/transactions", label: "Ledger", icon: <TransactionsIcon /> },
    { href: "/admin/redirects", label: "Router", icon: <RouterIcon /> },
    { href: "/admin/settings", label: "Configuration", icon: <SettingsIcon /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-base-200 text-base-content" data-theme="lightyellow">
      
      {/* Mobile Top App Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-base-100 border-b border-base-300 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-sm text-primary-content shadow-xs">
            D
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-base-content">Digitalcorebd</div>
            <div className="text-[10px] text-base-content/50 font-semibold mt-[-2px]">Admin Portal</div>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Navigation (Desktop Static & Mobile Drawer) */}
      <aside
        className={`fixed md:static top-0 bottom-0 left-0 z-50 md:z-auto w-72 bg-base-100 border-r border-base-300 flex flex-col p-6 shadow-md shrink-0 transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="pb-6 border-b border-base-200 mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-xl text-primary-content shadow-xs">
              D
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight text-base-content">Digitalcorebd</div>
              <div className="text-[10px] text-base-content/60 font-semibold mt-[-3px]">Store Management</div>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden btn btn-ghost btn-xs btn-circle"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || (item.href === "/admin/dashboard" && pathname === "/admin");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  isActive
                    ? "bg-primary text-primary-content shadow-xs"
                    : "hover:bg-base-200 text-base-content/80"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Admin User Profile Card & Logout */}
        <div className="mt-6 pt-4 border-t border-base-200 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
              {(adminUser?.email || "A").slice(0, 1).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="font-bold text-xs truncate text-base-content">
                {adminUser?.email || "admin@digitalcorebd.com"}
              </div>
              <div className="text-[10px] font-semibold text-success">Super Admin</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/"
              target="_blank"
              className="btn btn-outline btn-sm flex-1 rounded-xl font-bold text-xs"
            >
              Storefront ↗
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-error btn-sm flex-1 rounded-xl font-bold text-xs"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-w-full">
        {children}
      </main>
    </div>
  );
}
