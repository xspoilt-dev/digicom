"use client";

import { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/meta/track-event";
import Footer from "@/components/Footer";
import { Copy, Check, Eye, EyeOff, Key, CheckCircle2 } from "lucide-react";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  type: string;
  isWebDisplay: boolean;
  deliveryLink?: string;
  downloadUrl?: string;
}

interface DeliveryAccount {
  user?: string;
  password?: string;
  verifyEmail?: string;
  expiryText?: string;
  otherInfo?: string;
}

interface Order {
  orderId: string;
  name?: string;
  email?: string;
  phone?: string;
  total: number;
  status: "pending" | "processing" | "paid" | "failed" | "cancelled";
  paymentGateway?: string;
  paymentUrl?: string;
  metaEventId?: string;
  items: OrderItem[];
  transactionId?: string;
  paymentMethod?: string;
  bkashSender?: string;
  bkashTrxID?: string;
  fulfillmentStatus?: string;
  canbosoOrderCode?: string;
  deliveryAccounts?: DeliveryAccount[];
  slotMonths?: number;
}

// Icons
const SuccessShield = () => (
  <svg className="w-12 h-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const WarningShield = () => (
  <svg className="w-12 h-12 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4 inline-block align-middle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-4 h-4 inline-block align-middle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4 inline-block align-middle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function ReceiptPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<number, boolean>>({});

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyAll = () => {
    if (!order?.deliveryAccounts || order.deliveryAccounts.length === 0) return;
    const combined = order.deliveryAccounts
      .map((acc, idx) => {
        const lines = [`Account #${idx + 1}:`];
        if (acc.user) lines.push(`Username/Email: ${acc.user}`);
        if (acc.password) lines.push(`Password: ${acc.password}`);
        if (acc.verifyEmail) lines.push(`Recovery Email: ${acc.verifyEmail}`);
        if (acc.expiryText) lines.push(`Validity: ${acc.expiryText}`);
        if (acc.otherInfo) lines.push(`Instructions: ${acc.otherInfo}`);
        return lines.join("\n");
      })
      .join("\n\n---\n\n");

    navigator.clipboard.writeText(combined);
    setCopiedKey("all");
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const purchaseTrackedRef = useRef(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  async function fetchOrderStatus(showCheckingIndicator = false) {
    if (showCheckingIndicator) setChecking(true);
    try {
      const res = await fetch(`${apiUrl}/api/order-status/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || "অর্ডার তথ্য পাওয়া যায়নি।");
      }
    } catch (err) {
      setError("সার্ভারের সাথে যোগাযোগ করা যায়নি।");
    } finally {
      setLoading(false);
      if (showCheckingIndicator) setChecking(false);
    }
  }

  useEffect(() => {
    fetchOrderStatus();

    const pollInterval = setInterval(() => {
      if (order && (order.status === "pending" || order.status === "processing")) {
        fetchOrderStatus();
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [orderId, order?.status]);

  // Dual Deduplicated Purchase Event: Fires browser Pixel & CAPI with matching metaEventId
  useEffect(() => {
    if (order && order.status === "paid" && !purchaseTrackedRef.current) {
      purchaseTrackedRef.current = true;
      trackEvent(
        "Purchase",
        {
          content_ids: order.items.map((i) => i.id || i.title),
          content_type: "product",
          value: order.total,
          currency: "BDT",
          order_id: order.orderId,
          num_items: order.items.length,
        },
        {
          eventId: order.metaEventId || undefined,
          email: order.email,
          phone: order.phone,
        }
      );
    }
  }, [order?.status, order]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200" data-theme="lightyellow">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <span className="text-primary font-bold text-sm">অর্ডার ভেরিফাই করা হচ্ছে...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-base-200" data-theme="lightyellow">
        <div className="container mx-auto px-4 py-16 flex-1 flex items-center justify-center">
          <div className="card w-full max-w-md bg-base-100 border border-base-300 shadow-xl rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-black text-error mb-4">ভুল অর্ডার</h2>
            <p className="text-sm text-base-content/70 mb-6">{error || "অর্ডারটি সিস্টেমে পাওয়া যায়নি।"}</p>
            <Link href="/" className="btn btn-primary rounded-xl font-bold shadow-md">
              হোমপেজে ফিরে যান
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const statusBadges: Record<string, string> = {
    pending: "badge-warning text-stone-900",
    processing: "badge-primary text-primary-content",
    paid: "badge-success text-success-content",
    failed: "badge-error text-error-content",
    cancelled: "badge-ghost text-base-content/60",
  };

  const statusTexts: Record<string, string> = {
    pending: "পেমেন্ট বাকি আছে",
    processing: "ভেরিফিকেশন চলছে",
    paid: "পরিশোধিত / ভেরিফাইড",
    failed: "ব্যর্থ হয়েছে",
    cancelled: "বাতিল হয়েছে",
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-200 text-base-content" data-theme="lightyellow">
      {/* Top Navbar */}
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50 px-4 md:px-8 border-b border-base-300">
        <div className="navbar-start gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-black text-lg text-primary-content shadow-xs">
              D
            </div>
            <span className="font-extrabold text-base md:text-lg tracking-tight text-base-content">
              Digitalcorebd.com
            </span>
          </Link>
        </div>
        <div className="navbar-end gap-2">
          <Link href="/" className="btn btn-ghost btn-sm font-bold text-xs md:text-sm">
            হোমপেজ
          </Link>
          <Link href="/shop" className="btn btn-ghost btn-sm font-bold text-xs md:text-sm">
            শপ
          </Link>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 md:py-12 flex-1 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-base-content tracking-tight">
            ইনভয়েস বিবরণী
          </h1>
          <p className="text-xs md:text-sm text-base-content/60 mt-1">
            ইনভয়েস আইডিঃ <span className="font-mono font-bold text-primary">#{order.orderId}</span>
          </p>
        </div>

        {/* Invoice Summary Card */}
        <div className="card bg-base-100 border border-base-300 shadow-sm rounded-3xl p-6 md:p-8 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-base-200">
            <span className="font-bold text-base md:text-lg text-base-content">পেমেন্ট স্টেটাস</span>
            <span className={`badge ${statusBadges[order.status] || "badge-ghost"} py-3 px-4 font-bold text-xs`}>
              {statusTexts[order.status] || order.status}
            </span>
          </div>

          <div className="bg-base-200 rounded-2xl p-5 mb-6 text-xs md:text-sm space-y-2 border border-base-300">
            {order.name && (
              <div className="flex justify-between flex-wrap gap-1">
                <span className="font-bold text-base-content/80">গ্রাহকের নাম:</span>
                <span className="font-semibold text-base-content">{order.name}</span>
              </div>
            )}
            {order.email && (
              <div className="flex justify-between flex-wrap gap-1">
                <span className="font-bold text-base-content/80">ইমেইল এড্রেস:</span>
                <span className="font-semibold text-base-content">{order.email}</span>
              </div>
            )}
            {order.phone && (
              <div className="flex justify-between flex-wrap gap-1">
                <span className="font-bold text-base-content/80">মোবাইল নম্বর:</span>
                <span className="font-semibold text-base-content">{order.phone}</span>
              </div>
            )}
            <div className="flex justify-between flex-wrap gap-1">
              <span className="font-bold text-base-content/80">পেমেন্ট মাধ্যম:</span>
              <span className="font-semibold text-base-content">
                {order.paymentMethod ? `${order.paymentMethod.toUpperCase()} (অনলাইন)` : "ZiniPay অনলাইন পেমেন্ট"}
              </span>
            </div>
            {order.transactionId && (
              <div className="flex justify-between flex-wrap gap-1">
                <span className="font-bold text-base-content/80">ট্রানজেকশন আইডি:</span>
                <span className="font-mono font-bold text-primary">{order.transactionId}</span>
              </div>
            )}
            <div className="pt-2 border-t border-base-300 flex justify-between items-center">
              <span className="font-bold text-base-content">মোট ইনভয়েস মূল্য:</span>
              <span className="text-xl md:text-2xl font-black text-primary">৳{order.total}</span>
            </div>
          </div>

          <h3 className="font-bold text-sm md:text-base text-base-content mb-4 pb-2 border-b border-base-200">
            ক্রয়কৃত পণ্যসমূহ
          </h3>
          <div className="divide-y divide-base-200">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs md:text-sm text-base-content">{item.title}</span>
                  <span className="badge badge-primary badge-xs py-2 px-2 font-bold text-[10px]">
                    {item.type === "course" ? "ভিডিও কোর্স" : item.type === "pdf" ? "পিডিএফ বই" : "ডিজিটাল ফাইল"}
                  </span>
                </div>
                <span className="font-bold text-xs md:text-sm text-base-content">৳{item.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Payment Action Card */}
        {order.status === "pending" && (
          <div className="card bg-base-100 border-2 border-warning/70 shadow-md rounded-3xl p-6 md:p-8 text-center mb-6">
            <div className="flex justify-center mb-4">
              <WarningShield />
            </div>
            <h2 className="text-xl font-black text-base-content mb-2">
              পেমেন্ট এখনও সম্পন্ন হয়নি
            </h2>
            <p className="text-xs md:text-sm text-base-content/75 max-w-md mx-auto mb-6 leading-relaxed">
              আপনার ডিজিটাল ফাইলটি আনলক করতে নিচের বাটনে ক্লিক করে ZiniPay সুরক্ষিত গেটওয়েতে পেমেন্ট সম্পন্ন করুন।
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {order.paymentUrl && (
                <a
                  href={order.paymentUrl}
                  className="btn btn-primary rounded-xl font-bold px-8 shadow-md w-full sm:w-auto text-sm"
                >
                  এখনই পেমেন্ট সম্পন্ন করুন (৳{order.total}) →
                </a>
              )}
              <button
                onClick={() => fetchOrderStatus(true)}
                disabled={checking}
                className="btn btn-outline rounded-xl font-bold px-6 w-full sm:w-auto text-sm gap-2"
              >
                <RefreshIcon /> {checking ? "যাচাই করা হচ্ছে..." : "স্টেটাস রিফ্রেশ করুন"}
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-base-200 text-xs text-base-content/60 flex items-center justify-center gap-2">
              <span className="loading loading-spinner loading-xs text-primary"></span>
              পেমেন্ট যাচাইয়ের জন্য অপেক্ষা করা হচ্ছে (স্বয়ংক্রিয়ভাবে আপডেট হবে)
            </div>
          </div>
        )}

        {/* Processing State Card */}
        {order.status === "processing" && (
          <div className="card bg-base-100 border border-primary/50 shadow-md rounded-3xl p-6 md:p-8 text-center mb-6">
            <div className="flex justify-center mb-4">
              <WarningShield />
            </div>
            <h2 className="text-lg md:text-xl font-black text-primary mb-2">
              পেমেন্ট ভেরিফিকেশন চলছে
            </h2>
            <p className="text-xs md:text-sm text-base-content/75 max-w-md mx-auto mb-4 leading-relaxed">
              আপনার পেমেন্ট সিস্টেমের সাথে যোগাযোগ করে ভেরিফাই করা হচ্ছে। ভেরিফিকেশন সম্পন্ন হওয়া মাত্র ডিজিটাল ফাইলের ডাউনলোড লিংক স্বয়ংক্রিয়ভাবে উন্মুক্ত হবে।
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
              <span className="loading loading-spinner loading-xs text-primary"></span>
              পেমেন্ট চেক করা হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।
            </div>
          </div>
        )}

        {/* Paid / Completed Card */}
        {order.status === "paid" && (
          <div className="card bg-base-100 border-2 border-success shadow-lg rounded-3xl p-6 md:p-8 mb-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <SuccessShield />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-success">
                পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!
              </h2>
              <p className="text-xs md:text-sm text-base-content/70 mt-1">
                নিচে আপনার ক্রয়কৃত ডিজিটাল অ্যাকাউন্ট ও ফাইলসমূহ প্রদান করা হলোঃ
              </p>
            </div>

            {/* Delivered Canboso Digital Accounts */}
            {order.deliveryAccounts && order.deliveryAccounts.length > 0 && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between border-b border-base-300 pb-2.5">
                  <h3 className="font-extrabold text-sm md:text-base text-base-content flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    আপনার ডিজিটাল অ্যাকাউন্ট ও লগইন তথ্য
                  </h3>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="btn btn-xs btn-outline rounded-lg font-bold gap-1 text-[11px]"
                  >
                    {copiedKey === "all" ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    <span>{copiedKey === "all" ? "সব কপি হয়েছে" : "সব তথ্য কপি করুন"}</span>
                  </button>
                </div>

                {order.deliveryAccounts.map((acc, idx) => (
                  <div key={idx} className="bg-base-200 border-2 border-primary/20 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="badge badge-primary badge-sm font-bold text-primary-content">
                        অ্যাকাউন্ট #{idx + 1}
                      </span>
                      {acc.expiryText && (
                        <span className="text-[11px] font-bold text-success font-mono">
                          মেয়াদ: {acc.expiryText}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {acc.user && (
                        <div>
                          <label className="text-[10px] font-bold text-base-content/60 uppercase tracking-wider block mb-1">
                            ইউজারনেম / ইমেইল
                          </label>
                          <div className="flex items-center justify-between bg-base-100 p-2.5 rounded-xl border border-base-300 font-mono text-xs">
                            <span className="font-bold select-all text-base-content truncate pr-2">{acc.user}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(acc.user!, `user-${idx}`)}
                              className="btn btn-ghost btn-xs btn-circle shrink-0"
                              title="Copy username"
                            >
                              {copiedKey === `user-${idx}` ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {acc.password && (
                        <div>
                          <label className="text-[10px] font-bold text-base-content/60 uppercase tracking-wider block mb-1">
                            পাসওয়ার্ড
                          </label>
                          <div className="flex items-center justify-between bg-base-100 p-2.5 rounded-xl border border-base-300 font-mono text-xs">
                            <span className="font-bold select-all text-base-content truncate pr-2">
                              {revealedPasswords[idx] ? acc.password : "••••••••••••"}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setRevealedPasswords((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                                className="btn btn-ghost btn-xs btn-circle"
                                title={revealedPasswords[idx] ? "Hide password" : "Show password"}
                              >
                                {revealedPasswords[idx] ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(acc.password!, `pw-${idx}`)}
                                className="btn btn-ghost btn-xs btn-circle"
                                title="Copy password"
                              >
                                {copiedKey === `pw-${idx}` ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {acc.verifyEmail && (
                        <div>
                          <label className="text-[10px] font-bold text-base-content/60 uppercase tracking-wider block mb-1">
                            রিকভারি / ভেরিফিকেশন ইমেইল
                          </label>
                          <div className="flex items-center justify-between bg-base-100 p-2.5 rounded-xl border border-base-300 font-mono text-xs">
                            <span className="select-all text-base-content truncate pr-2">{acc.verifyEmail}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(acc.verifyEmail!, `verify-${idx}`)}
                              className="btn btn-ghost btn-xs btn-circle shrink-0"
                              title="Copy recovery email"
                            >
                              {copiedKey === `verify-${idx}` ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {acc.otherInfo && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 text-stone-800 rounded-xl text-xs font-medium">
                          নির্দেশনা: {acc.otherInfo}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <p className="text-xs text-base-content/60 text-center">
                  এই লগইন এক্সেস বিবরণী আপনার ইমেইল ({order.email}) ঠিকানায়ও পাঠানো হয়েছে।
                </p>
              </div>
            )}

            {/* Slot Invite Notice if applicable */}
            {order.slotMonths && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold mb-6 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  আপনার প্রদত্ত ইমেইল ({order.email}) ঠিকানায় ওয়ার্কস্পেস ইনভাইটেশন ({order.slotMonths} মাসের মেয়াদ) পাঠানো হয়েছে। আপনার ইমেইল ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।
                </span>
              </div>
            )}

            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="bg-base-200 border border-base-300 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm md:text-base text-base-content">{item.title}</h4>
                    <span className="badge badge-primary badge-xs py-2 px-2 font-bold text-[10px] mt-1">
                      {item.type === "course" ? "ভিডিও কোর্স" : item.type === "pdf" ? "পিডিএফ বই" : "ডিজিটাল ফাইল"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.downloadUrl && (
                      <a
                        href={`${apiUrl}${item.downloadUrl}`}
                        download
                        className="btn btn-primary btn-sm rounded-xl font-bold shadow-xs gap-1.5"
                      >
                        <DownloadIcon /> ডাউনলোড করুন
                      </a>
                    )}
                    {item.deliveryLink && (
                      <a
                        href={item.deliveryLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline btn-sm rounded-xl font-bold gap-1.5"
                      >
                        <LinkIcon /> সরাসরি দেখুন
                      </a>
                    )}
                    {!item.isWebDisplay && !order.deliveryAccounts && (
                      <span className="text-xs text-base-content/60 italic self-center">
                        লিংকটি আপনার ইমেইল ঠিকানায় পাঠানো হয়েছে।
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failed / Cancelled Card */}
        {(order.status === "failed" || order.status === "cancelled") && (
          <div className="card bg-base-100 border-2 border-error/50 shadow-md rounded-3xl p-6 md:p-8 text-center mb-6">
            <h2 className="text-lg md:text-xl font-black text-error mb-2">
              {order.status === "failed" ? "পেমেন্ট ব্যর্থ হয়েছে" : "অর্ডারটি বাতিল করা হয়েছে"}
            </h2>
            <p className="text-xs md:text-sm text-base-content/75 max-w-md mx-auto mb-6 leading-relaxed">
              পেমেন্ট প্রক্রিয়া সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় অর্ডার করুন অথবা সাপোর্টে যোগাযোগ করুন।
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/" className="btn btn-primary rounded-xl font-bold text-sm">
                হোমপেজে ফিরে যান
              </Link>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <Link href="/" className="btn btn-ghost btn-sm font-bold text-xs text-base-content/70">
            ← হোমপেজে ফিরে যান
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
