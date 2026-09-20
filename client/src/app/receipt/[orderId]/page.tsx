"use client";

import { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/meta/track-event";
import Footer from "@/components/Footer";

interface DeliveryAccount {
  user: string;
  password?: string;
  verifyEmail?: string;
  expiryText?: string;
  otherInfo?: string;
}

interface OrderItem {
  id: string;
  title: string;
  price: number;
  type: string;
  duration?: string;
  isWebDisplay: boolean;
  deliveryLink?: string;
  downloadUrl?: string;
}

interface Order {
  orderId: string;
  name?: string;
  email?: string;
  phone?: string;
  customerEmail?: string;
  slotMonths?: number;
  quantity?: number;
  total: number;
  status: "pending" | "processing" | "paid" | "failed" | "cancelled";
  fulfillmentStatus?: "unfulfilled" | "waiting_seller" | "completed" | "failed";
  autoCompleted?: boolean;
  upstreamOrderCode?: string;
  deliveryAccounts?: DeliveryAccount[];
  paymentGateway?: string;
  paymentUrl?: string;
  metaEventId?: string;
  items: OrderItem[];
  transactionId?: string;
  paymentMethod?: string;
  bkashSender?: string;
  bkashTrxID?: string;
}

// Icons
const SuccessShield = () => (
  <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const WarningShield = () => (
  <svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

const CopyIcon = () => (
  <svg className="w-3.5 h-3.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-3.5 h-3.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-3.5 h-3.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
  </svg>
);

export default function ReceiptPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [revealedPasswords, setRevealedPasswords] = useState<Record<number, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
    } catch {
      setError("সার্ভারের সাথে যোগাযোগ করা সম্ভব হয়নি।");
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
          email: order.email || order.customerEmail,
          phone: order.phone,
          skipCapi: false,
        }
      );
    }
  }, [order]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleReveal = (idx: number) => {
    setRevealedPasswords((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyAllCredentials = () => {
    if (!order?.deliveryAccounts || order.deliveryAccounts.length === 0) return;
    const lines = order.deliveryAccounts.map((acc, i) => {
      return `[Account #${i + 1}]\nUser: ${acc.user}\nPassword: ${acc.password || "N/A"}\nRecovery: ${acc.verifyEmail || "N/A"}\nValidity: ${acc.expiryText || "Active"}\n`;
    });
    copyToClipboard(lines.join("\n"), "all");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-white">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-cyan-400"></span>
          <span className="text-xs font-bold text-slate-400">অর্ডার ভেরিফাই করা হচ্ছে...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] p-4 text-white">
        <div className="bg-[#0d1527] border border-slate-800 shadow-xl rounded-3xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <WarningShield />
          </div>
          <h2 className="text-lg font-black text-white mb-2">অর্ডার পাওয়া যায়নি</h2>
          <p className="text-xs text-slate-400 mb-6">{error || "অর্ডারের কোনো রেকর্ড মেলেনি।"}</p>
          <Link href="/" className="btn btn-primary rounded-xl font-bold w-full text-sm">
            হোমপেজে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <header className="navbar bg-[#0b1120] border-b border-slate-800 px-4 md:px-8">
        <div className="navbar-start">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black text-sm">
              KB
            </div>
            <span className="text-lg font-black text-white">KaloBazar</span>
          </Link>
        </div>
        <div className="navbar-end">
          <span className="badge badge-outline border-slate-700 text-slate-300 text-xs font-bold px-3 py-2">
            ইনভয়েস: {order.orderId}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8 md:py-12 flex-1 max-w-3xl">
        {/* Order Meta Header Card */}
        <div className="bg-[#0e1628] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">অর্ডার কোড</div>
              <div className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                {order.orderId}
                {order.upstreamOrderCode && (
                  <span className="badge badge-xs bg-slate-800 border-slate-700 text-cyan-400 text-[9px] font-mono px-2 py-1">
                    API: {order.upstreamOrderCode}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">বর্তমান অবস্থা</div>
              <div>
                {order.status === "paid" && (
                  <span className="badge badge-success text-white font-bold text-xs px-3 py-2">
                    ✓ পরিশোধিত ও সক্রিয়
                  </span>
                )}
                {order.status === "pending" && (
                  <span className="badge badge-warning text-black font-bold text-xs px-3 py-2">
                    পেমেন্ট অপেক্ষমাণ
                  </span>
                )}
                {order.status === "processing" && (
                  <span className="badge badge-info text-white font-bold text-xs px-3 py-2">
                    ভেরিফিকেশন চলছে
                  </span>
                )}
                {(order.status === "failed" || order.status === "cancelled") && (
                  <span className="badge badge-error text-white font-bold text-xs px-3 py-2">
                    ব্যর্থ / বাতিল
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs">
            <div>
              <span className="text-slate-400">গ্রাহকের নাম:</span>{" "}
              <span className="font-bold text-white">{order.name || "গেস্ট কাস্টমার"}</span>
            </div>
            <div>
              <span className="text-slate-400">যোগাযোগের ইমেইল:</span>{" "}
              <span className="font-bold text-white">{order.email || "N/A"}</span>
            </div>
            {order.customerEmail && (
              <div className="sm:col-span-2 bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold">টিম স্লট / ইনভাইট ইমেইল:</span>{" "}
                  <span className="font-bold text-white">{order.customerEmail}</span>
                </div>
                {order.slotMonths && (
                  <span className="badge badge-sm bg-cyan-500/20 text-cyan-300 font-bold">
                    {order.slotMonths} মাসের এক্সেস
                  </span>
                )}
              </div>
            )}
            {order.phone && (
              <div>
                <span className="text-slate-400">মোবাইল:</span>{" "}
                <span className="font-bold text-white">{order.phone}</span>
              </div>
            )}
            {order.transactionId && (
              <div>
                <span className="text-slate-400">TrxID:</span>{" "}
                <span className="font-bold text-cyan-400 font-mono">{order.transactionId}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
            <span className="font-bold text-slate-300">পরিশোধিত মূল্য:</span>
            <span className="text-xl md:text-2xl font-black text-cyan-400">৳{order.total}</span>
          </div>
        </div>

        {/* Pending Payment Card */}
        {order.status === "pending" && (
          <div className="bg-[#0e1628] border-2 border-amber-500/50 shadow-md rounded-3xl p-6 md:p-8 text-center mb-6">
            <div className="flex justify-center mb-4">
              <WarningShield />
            </div>
            <h2 className="text-xl font-black text-white mb-2">পেমেন্ট এখনও সম্পন্ন হয়নি</h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
              আপনার ডিজিটাল অ্যাকাউন্টটি আনলক করতে নিচের বাটনে ক্লিক করে সুরক্ষিত ZiniPay গেটওয়েতে পেমেন্ট সম্পন্ন করুন।
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
                className="btn btn-outline border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl font-bold px-6 w-full sm:w-auto text-sm gap-2"
              >
                <RefreshIcon /> {checking ? "যাচাই করা হচ্ছে..." : "স্টেটাস রিফ্রেশ করুন"}
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
              <span className="loading loading-spinner loading-xs text-cyan-400"></span>
              পেমেন্ট ভেরিফিকেশনের জন্য অপেক্ষা করা হচ্ছে (স্বয়ংক্রিয়ভাবে আপডেট হবে)
            </div>
          </div>
        )}

        {/* Processing State Card */}
        {order.status === "processing" && (
          <div className="bg-[#0e1628] border border-cyan-500/50 shadow-md rounded-3xl p-6 md:p-8 text-center mb-6">
            <div className="flex justify-center mb-4">
              <WarningShield />
            </div>
            <h2 className="text-lg md:text-xl font-black text-cyan-400 mb-2">পেমেন্ট ভেরিফিকেশন চলছে</h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-md mx-auto mb-4 leading-relaxed">
              পেমেন্ট গেটওয়ের সাথে যোগাযোগ করে অ্যাকাউন্ট বা ইনভাইট প্রস্তুত করা হচ্ছে। কিছুক্ষণের মধ্যে ডিটেইলস দৃশ্যমান হবে।
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <span className="loading loading-spinner loading-xs text-cyan-400"></span>
              ভেরিফিকেশন চলছে... অনুগ্রহ করে অপেক্ষা করুন।
            </div>
          </div>
        )}

        {/* Paid / Completed - DIGITAL ACCOUNT CREDENTIALS & DELIVERY CARD */}
        {order.status === "paid" && (
          <div className="bg-[#0e1628] border-2 border-emerald-500/80 shadow-2xl rounded-3xl p-6 md:p-8 mb-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <SuccessShield />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-emerald-400">
                পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!
              </h2>
              <p className="text-xs md:text-sm text-slate-300 mt-1 font-medium">
                আপনার ডিজিটাল অ্যাকাউন্ট ডিটেইলস বা সাবস্ক্রিপশন ইনভাইটেশন সক্রিয় করা হয়েছে।
              </p>
            </div>

            {/* If Delivery Accounts are provided */}
            {order.deliveryAccounts && order.deliveryAccounts.length > 0 && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    🔐 অ্যাকাউন্ট লগইন ক্রেডেনশিয়াল
                  </span>
                  <button
                    onClick={copyAllCredentials}
                    className="btn btn-xs btn-outline border-slate-700 text-cyan-400 hover:bg-slate-800 rounded-lg gap-1"
                  >
                    <CopyIcon /> {copiedField === "all" ? "কপি হয়েছে!" : "সব কপি করুন"}
                  </button>
                </div>

                {order.deliveryAccounts.map((acc, idx) => {
                  const isRevealed = revealedPasswords[idx];
                  return (
                    <div
                      key={idx}
                      className="bg-[#090d16] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3"
                    >
                      {/* Username / User */}
                      <div className="flex items-center justify-between gap-2 bg-[#121a2d] p-3 rounded-xl border border-slate-800">
                        <div className="truncate">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">ইউজার / ইমেইল</div>
                          <div className="text-sm font-mono font-bold text-white select-all">{acc.user}</div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(acc.user, `user-${idx}`)}
                          className="btn btn-xs btn-ghost text-slate-300 hover:text-cyan-400"
                        >
                          <CopyIcon /> {copiedField === `user-${idx}` ? "কপি হয়েছে" : "কপি"}
                        </button>
                      </div>

                      {/* Password */}
                      {acc.password && (
                        <div className="flex items-center justify-between gap-2 bg-[#121a2d] p-3 rounded-xl border border-slate-800">
                          <div className="truncate">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">পাসওয়ার্ড</div>
                            <div className="text-sm font-mono font-bold text-cyan-300 select-all">
                              {isRevealed ? acc.password : "••••••••••••"}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleReveal(idx)}
                              className="btn btn-xs btn-ghost text-slate-400 hover:text-white"
                            >
                              {isRevealed ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(acc.password || "", `pass-${idx}`)}
                              className="btn btn-xs btn-ghost text-slate-300 hover:text-cyan-400"
                            >
                              <CopyIcon /> {copiedField === `pass-${idx}` ? "কপি হয়েছে" : "কপি"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Recovery / Verify Email if present */}
                      {acc.verifyEmail && (
                        <div className="flex items-center justify-between gap-2 bg-[#121a2d] p-3 rounded-xl border border-slate-800">
                          <div className="truncate">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">রিকভারি / ভেরিফাই ইমেইল</div>
                            <div className="text-xs font-mono text-slate-300 select-all">{acc.verifyEmail}</div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(acc.verifyEmail || "", `rec-${idx}`)}
                            className="btn btn-xs btn-ghost text-slate-300 hover:text-cyan-400"
                          >
                            <CopyIcon /> {copiedField === `rec-${idx}` ? "কপি হয়েছে" : "কপি"}
                          </button>
                        </div>
                      )}

                      {/* Expiry & Other Notes */}
                      {(acc.expiryText || acc.otherInfo) && (
                        <div className="text-[11px] text-slate-400 pt-1 space-y-1">
                          {acc.expiryText && (
                            <div>
                              <span className="font-bold text-slate-300">মেয়াদ:</span> {acc.expiryText}
                            </div>
                          )}
                          {acc.otherInfo && (
                            <div>
                              <span className="font-bold text-amber-400">নির্দেশনা:</span> {acc.otherInfo}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* If Slot / Team Invite Product */}
            {order.customerEmail && (
              <div className="bg-[#090d16] border border-cyan-500/30 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-2">
                  <span>📧</span>
                  <span>টিম ওয়ার্কস্পেস ইনভাইটেশন স্ট্যাটাস</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  আপনার প্রদানকৃত ইমেইল <strong className="text-white font-mono">{order.customerEmail}</strong> এ টিম
                  ইনভাইটেশন লিংক প্রেরণ করা হয়েছে। অনুগ্রহ করে আপনার ইমেইল ইনবক্স বা স্প্যাম ফোল্ডার চেক করে ইনভাইটেশনটি
                  গ্রহণ (Accept) করুন।
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="badge badge-success badge-sm font-bold text-white">ইনভাইটেশন ডিসপ্যাচ সম্পন্ন</span>
                  {order.slotMonths && (
                    <span className="badge badge-outline border-slate-700 text-xs text-slate-300">
                      {order.slotMonths} মাসের অ্যাক্টিভেশন
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Itemized Deliverables */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ক্রয়কৃত সার্ভিসসমূহ:</span>
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#090d16] border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-sm text-white">{item.title}</h4>
                    <span className="badge badge-primary badge-xs py-1.5 px-2 font-bold text-[10px] mt-1">
                      {item.type === "slot"
                        ? "টিম স্লট"
                        : item.type === "account"
                        ? "ইনস্ট্যান্ট অ্যাকাউন্ট"
                        : "ডিজিটাল পণ্য"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.downloadUrl && (
                      <a
                        href={`${apiUrl}${item.downloadUrl}`}
                        download
                        className="btn btn-primary btn-sm rounded-xl font-bold shadow-sm gap-1.5"
                      >
                        <DownloadIcon /> ডাউনলোড করুন
                      </a>
                    )}
                    {item.deliveryLink && (
                      <a
                        href={item.deliveryLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline border-slate-700 text-slate-200 hover:bg-slate-800 btn-sm rounded-xl font-bold gap-1.5"
                      >
                        <LinkIcon /> সরাসরি দেখুন
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Support Box */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <span>লগইন বা ইনভাইটেশনে কোনো সমস্যা হলে সাপোর্টে যোগাযোগ করুনঃ</span>
              <a
                href="https://t.me/kalobazar_support"
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 rounded-xl font-bold"
              >
                টেলিগ্রাম সাপোর্ট →
              </a>
            </div>
          </div>
        )}

        {/* Failed / Cancelled Card */}
        {(order.status === "failed" || order.status === "cancelled") && (
          <div className="bg-[#0e1628] border-2 border-red-500/50 shadow-md rounded-3xl p-6 md:p-8 text-center mb-6">
            <h2 className="text-lg md:text-xl font-black text-red-400 mb-2">
              {order.status === "failed" ? "পেমেন্ট ব্যর্থ হয়েছে" : "অর্ডারটি বাতিল করা হয়েছে"}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
              পেমেন্ট প্রক্রিয়া সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন অথবা টেলিগ্রাম সাপোর্টে মেসেজ দিন।
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/" className="btn btn-primary rounded-xl font-bold text-sm">
                মার্কেটপ্লেসে ফিরে যান
              </Link>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <Link href="/" className="btn btn-ghost btn-sm font-bold text-xs text-slate-400 hover:text-white">
            ← মার্কেটপ্লেসে ফিরে যান
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
