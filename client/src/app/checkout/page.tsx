"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { trackEvent } from "@/lib/meta/track-event";
import { getFbCookies } from "@/lib/meta/cookies";
import { ShoppingCart, ShieldCheck, Zap, ArrowLeft, CheckCircle, Package } from "lucide-react";
import { normalizeBanglaPhone } from "@/utils/bengali";

export default function CheckoutPage() {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setErrorMsg("আপনার কার্টে কোনো প্রোডাক্ট নেই।");
      return;
    }

    const cleanPhone = normalizeBanglaPhone(formData.phone.trim());
    if (!formData.name.trim() || !formData.email.trim() || !cleanPhone) {
      setErrorMsg("দয়া করে নাম, ইমেইল এবং সঠিক মোবাইল নম্বর পূরণ করুন।");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const fbCookies = getFbCookies();
    const eventId = trackEvent(
      "InitiateCheckout",
      {
        content_ids: cartItems.map((i) => i.productId),
        content_type: "product",
        value: cartTotal,
        currency: "BDT",
        num_items: cartItems.length,
      },
      {
        email: formData.email,
        phone: cleanPhone,
        skipCapi: true,
      }
    );

    try {
      const res = await fetch(`${apiUrl}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: cleanPhone,
          paymentGateway: "zinipay",
          metaEventId: eventId,
          fbp: fbCookies.fbp,
          fbc: fbCookies.fbc,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Clear local cart upon order placement
        clearCart();

        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else if (data.order?.orderId) {
          router.push(`/receipt/${data.order.orderId}`);
        }
      } else {
        setErrorMsg(data.message || "চেকআউট প্রক্রিয়া ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
      }
    } catch (err) {
      setErrorMsg("নেটওয়ার্ক সমস্যা। সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-200 text-base-content">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex-1 max-w-7xl">
        {/* Page Title */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-stone-900">
            অর্ডার চেকআউট
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
            আপনার তথ্য দিয়ে বিকাশ, নগদ বা কার্ডের মাধ্যমে তাৎক্ষণিক পেমেন্ট সম্পন্ন করুন
          </p>
        </div>

        {/* Delivery Info Banner */}
        <div className="mb-8 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3.5 max-w-3xl mx-auto">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800">তাৎক্ষণিক ডিজিটাল ডেলিভারি</p>
            <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
              Payment সম্পন্ন করার সাথে সাথে আপনার product পেয়ে যাবেন এবং আপনার email-এ product চলে যাবে।
            </p>
          </div>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="card max-w-md mx-auto bg-white border-2 border-amber-200/80 rounded-3xl p-8 text-center shadow-lg space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-stone-900">আপনার কার্ট খালি!</h2>
            <p className="text-xs text-stone-500">
              চেকআউট করার জন্য প্রথমে শপ থেকে আপনার পছন্দের একাউন্ট বা সাবস্ক্রিপশন যোগ করুন।
            </p>
            <Link
              href="/shop"
              className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 font-black border-none rounded-full px-6 shadow-md"
            >
              শপে পণ্য দেখুন
            </Link>
          </div>
        ) : (
          /* 2-Column Responsive Checkout Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Customer Form & Payment */}
            <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-amber-200/80 shadow-md p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 border-b border-amber-100 pb-4">
                <span className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-sm">
                  1
                </span>
                <h2 className="text-lg font-black text-stone-900">আপনার যোগাযোগ তথ্য</h2>
              </div>

              {errorMsg && (
                <div className="alert alert-error text-xs font-bold rounded-2xl shadow-xs">
                  <span>{errorMsg}</span>
                </div>
              )}

              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-stone-700">আপনার পূর্ণ নাম *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="উদাঃ মোঃ রহিম হোসেন"
                    className="input input-bordered w-full rounded-xl bg-amber-50/30 border-amber-200 focus:border-amber-400 focus:outline-none text-sm text-stone-800"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-stone-700">
                      ইমেইল ঠিকানা * <span className="text-amber-600">(এখানে ডেলিভারি ও লগইন পাঠানো হবে)</span>
                    </span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="input input-bordered w-full rounded-xl bg-amber-50/30 border-amber-200 focus:border-amber-400 focus:outline-none text-sm text-stone-800"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {/* Phone */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-stone-700">মোবাইল নম্বর * (বিকাশ/নগদ নম্বর)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="017xxxxxxxx বা ০১৭xxxxxxxx"
                    className="input input-bordered w-full rounded-xl bg-amber-50/30 border-amber-200 focus:border-amber-400 focus:outline-none text-sm text-stone-800"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                {/* Payment Info */}
                <div className="pt-4 border-t border-stone-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-sm">
                      2
                    </span>
                    <h2 className="text-lg font-black text-stone-900">পেমেন্ট মেথড</h2>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">বিকাশ / নগদ এর মাধ্যমে পেমেন্ট করুন</p>
                      <p className="text-xs text-stone-500 mt-0.5">পরবর্তী পেজে বিকাশ, নগদ, রকেট বা কার্ড দিয়ে পেমেন্ট করুন</p>
                    </div>
                  </div>
                </div>

                {/* Security Strip */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-3 text-xs text-stone-600">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-stone-800 block">১০০% নিরাপদ ও এনক্রিপ্টেড পেমেন্ট</span>
                    <span className="text-[11px] text-stone-500">পেমেন্ট সম্পন্ন হওয়ার সাথে সাথে স্বয়ংক্রিয়ভাবে ডেলিভারি হবে।</span>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-amber-200/80 shadow-md p-6 md:p-8 space-y-6 sticky top-24">
              <div className="flex items-center justify-between border-b border-amber-100 pb-4">
                <h2 className="text-lg font-black text-stone-900">অর্ডার সামারি</h2>
                <span className="badge bg-amber-400 text-stone-950 font-black text-xs px-2.5 py-1 border-none">
                  {cartItems.length}টি আইটেম
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between gap-3 p-2.5 bg-amber-50/40 rounded-2xl border border-amber-200/60"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-stone-900 truncate">
                        {item.title}
                      </h4>
                      <div className="text-[11px] text-stone-500 font-semibold mt-0.5">
                        ৳{item.price} × {item.quantity} = <span className="font-black text-amber-700">৳{item.price * item.quantity}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-white border border-amber-200 text-xs font-black text-stone-700 hover:bg-amber-100"
                      >
                        -
                      </button>
                      <span className="w-5 text-center text-xs font-black text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-white border border-amber-200 text-xs font-black text-stone-700 hover:bg-amber-100"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-stone-400 hover:text-error ml-1 p-1"
                        aria-label="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost Calculations */}
              <div className="space-y-2 pt-4 border-t border-amber-100 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>সাবটোটাল:</span>
                  <span className="font-bold text-stone-900">৳{cartTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>ডিজিটাল ডেলিভারি ফি:</span>
                  <span className="font-bold text-success">ফ্রি (৳০)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-amber-200/80 text-base">
                  <span className="font-black text-stone-900">সর্বমোট প্রদেয়:</span>
                  <span className="font-black text-2xl text-amber-600">৳{cartTotal}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 font-black border-none w-full rounded-2xl py-3.5 text-sm shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-xs"></span>
                    অর্ডার প্রসেস হচ্ছে...
                  </span>
                ) : (
                  `অর্ডার কনফার্ম ও পেমেন্ট করুন (৳${cartTotal})`
                )}
              </button>

              <div className="text-center">
                <Link href="/shop" className="text-xs font-bold text-stone-500 hover:text-amber-600 transition-colors">
                  ← শপিংয়ে ফিরে যান
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
