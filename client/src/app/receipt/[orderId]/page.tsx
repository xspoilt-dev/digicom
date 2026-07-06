"use client";

import { useEffect, useState, use } from "react";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  type: string;
  isWebDisplay: boolean;
  deliveryLink?: string;
  downloadUrl?: string;
}

interface Order {
  orderId: string;
  name?: string;
  email?: string;
  phone?: string;
  total: number;
  status: "pending" | "processing" | "paid" | "failed" | "cancelled";
  paymentGateway: "bkash" | "eps";
  items: OrderItem[];
  bkashSender?: string;
  bkashTrxID?: string;
}

// Beautiful SVG Icons
const SuccessShield = () => (
  <svg className="w-12 h-12 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "48px", height: "48px", color: "var(--tertiary)" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const WarningShield = () => (
  <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "48px", height: "48px", color: "var(--primary)" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px", display: "inline-block", verticalAlign: "middle" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px", display: "inline-block", verticalAlign: "middle" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

export default function ReceiptPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;

  const [order, setOrder] = useState<Order | null>(null);
  const [companyInfo, setCompanyInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trxID, setTrxID] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [submittingTrx, setSubmittingTrx] = useState(false);
  const [trxSuccessMessage, setTrxSuccessMessage] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  async function fetchOrderStatus() {
    try {
      const res = await fetch(`${apiUrl}/api/order-status/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setCompanyInfo(data.companyInfo || {});
      } else {
        setError(data.message || "অর্ডার তথ্য পাওয়া যায়নি।");
      }
    } catch (err) {
      setError("সার্ভারের সাথে যোগাযোগ করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrderStatus();

    const pollInterval = setInterval(() => {
      if (order && (order.status === "pending" || order.status === "processing")) {
        fetchOrderStatus();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [orderId, order?.status]);

  const handleBkashVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxID || !senderNumber) return;

    setSubmittingTrx(true);
    try {
      const res = await fetch(`${apiUrl}/api/checkout/verify-bkash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          trxID,
          senderNumber,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTrxSuccessMessage(data.message);
        fetchOrderStatus();
      } else {
        alert(data.message || "ভেরিফিকেশন সাবমিট করা যায়নি।");
      }
    } catch (err) {
      alert("ত্রুটি দেখা দিয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmittingTrx(false);
    }
  };

  const triggerMockEpsCallback = async () => {
    try {
      const mockTrx = `MOCK-EPS-${Date.now()}`;
      const res = await fetch(`${apiUrl}/api/checkout/eps-callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "success",
          transaction_id: mockTrx,
          order_id: orderId,
          amount: order?.total || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("ইপিএস পেমেন্ট সফলভাবে ভেরিফাই করা হয়েছে! রিলোড হচ্ছে...");
        fetchOrderStatus();
      }
    } catch (err) {
      alert("ইপিএস প্রসেস সাবমিট করা যায়নি।");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f8fafc" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "40px", height: "40px", border: "4px solid #0058be", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
          <div style={{ color: "#0058be", fontSize: "1.1rem", fontWeight: "600" }}>অর্ডার ভেরিফাই করা হচ্ছে...</div>
        </div>
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: "500px", margin: "0 auto", padding: "40px" }}>
          <h2 className="headline-sm" style={{ color: "var(--error)", marginBottom: "16px" }}>
            ভুল অর্ডার
          </h2>
          <p style={{ marginBottom: "24px", color: "var(--on-surface-variant)" }}>{error || "অর্ডারটি সিস্টেমে পাওয়া যায়নি।"}</p>
          <a href="/" className="btn btn-primary">
            হোমপেজে ফিরে যান
          </a>
        </div>
      </div>
    );
  }

  const statusBadges = {
    pending: "badge-secondary",
    processing: "badge-primary",
    paid: "badge-success",
    failed: "badge-error",
    cancelled: "badge-error",
  };

  const statusTexts = {
    pending: "পেমেন্ট বাকি আছে",
    processing: "ভেরিফিকেশন চলছে",
    paid: "পরিশোধিত / ভেরিফাইড",
    failed: "ব্যর্থ হয়েছে",
    cancelled: "বাতিল হয়েছে",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "50px 24px", backgroundColor: "var(--background)" }}>
      <main className="container" style={{ flex: 1, maxWidth: "720px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h1 className="headline-md" style={{ color: "var(--on-background)", letterSpacing: "-0.5px" }}>
            ইনভয়েস বিবরণী
          </h1>
          <p style={{ color: "var(--on-surface-variant)", marginTop: "6px", fontSize: "0.95rem" }}>
            ইনভয়েস আইডিঃ <span style={{ fontFamily: "monospace", fontWeight: "700" }}>#{order.orderId}</span>
          </p>
        </div>

        {/* Invoice Summary Card */}
        <div className="card" style={{ padding: "32px", marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "16px" }}>
            <span style={{ fontWeight: "700", fontSize: "1.1rem", color: "var(--on-surface)" }}>পেমেন্ট স্টেটাস</span>
            <span className={`badge ${statusBadges[order.status]}`} style={{ padding: "6px 14px", fontSize: "0.85rem", fontWeight: "700" }}>
              {statusTexts[order.status]}
            </span>
          </div>

          <div
            style={{
              padding: "20px",
              background: "var(--surface-low)",
              borderRadius: "16px",
              marginBottom: "28px",
              fontSize: "0.95rem",
              lineHeight: "1.7",
              border: "1px solid var(--outline-variant)",
            }}
          >
            {order.name && (
              <div>
                <strong>গ্রাহকের নাম:</strong> {order.name}
              </div>
            )}
            {order.email && (
              <div>
                <strong>ইমেইল এড্রেস:</strong> {order.email}
              </div>
            )}
            {order.phone && (
              <div>
                <strong>মোবাইল নম্বর:</strong> {order.phone}
              </div>
            )}
            <div>
              <strong>পেমেন্ট মাধ্যম:</strong>{" "}
              {order.paymentGateway === "bkash" ? "বিকাশ পার্সোনাল (ম্যানুয়াল)" : "ইপিএস পেমেন্ট গেটওয়ে (স্বয়ংক্রিয়)"}
            </div>
            <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed var(--outline-variant)" }}>
              <strong>মোট ইনভয়েস মূল্য:</strong>{" "}
              <span style={{ fontWeight: "800", color: "var(--primary)", fontSize: "1.25rem" }}>৳{order.total}</span>
            </div>
          </div>

          <h3 className="label-md" style={{ fontSize: "1rem", color: "var(--on-surface)", marginBottom: "16px", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "8px" }}>
            ক্রয়কৃত পণ্যসমূহ
          </h3>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {order.items.map((item, idx) => (
              <li
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "14px 0",
                  borderBottom: idx < order.items.length - 1 ? "1px dashed var(--outline-variant)" : "none",
                }}
              >
                <div>
                  <span style={{ fontWeight: "600", color: "var(--on-surface)" }}>{item.title}</span>
                  <span
                    className="badge badge-primary"
                    style={{ fontSize: "0.7rem", marginLeft: "10px", verticalAlign: "middle" }}
                  >
                    {item.type === "course" ? "ভিডিও কোর্স" : item.type === "pdf" ? "পিডিএফ বই" : "ডিজিটাল ফাইল"}
                  </span>
                </div>
                <span style={{ fontWeight: "700", color: "var(--on-surface)" }}>৳{item.price}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Status-specific action segments */}
        {order.status === "pending" && order.paymentGateway === "bkash" && (
          <div className="card" style={{ padding: "32px", border: "2px solid #e11d48", marginBottom: "30px" }}>
            <h2 className="headline-sm" style={{ color: "#e11d48", fontSize: "1.25rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
              বিকাশ পেমেন্ট নির্দেশিকা
            </h2>
            <div style={{ fontSize: "0.95rem", color: "var(--on-surface-variant)", lineHeight: "1.8", marginBottom: "24px" }}>
              <ol style={{ paddingLeft: "20px" }}>
                <li style={{ marginBottom: "6px" }}>
                  আপনার বিকাশ অ্যাপে যান অথবা ডায়াল করুন <strong>*২৪৭#</strong>
                </li>
                <li style={{ marginBottom: "6px" }}>
                  নিচে দেওয়া বিকাশ পার্সোনাল নম্বরে <strong>Send Money</strong> করুন সর্বমোট <strong>৳{order.total}</strong> টাকাঃ
                  <strong style={{ fontSize: "1.25rem", color: "#e11d48", display: "block", margin: "10px 0", background: "rgba(225,29,72,0.05)", padding: "12px", borderRadius: "12px", border: "1px dashed rgba(225,29,72,0.3)", textAlign: "center" }}>
                    {companyInfo.bkashNumber || "017XX-XXXXXX"} (বিকাশ পার্সোনাল)
                  </strong>
                </li>
                <li style={{ marginBottom: "6px" }}>পেমেন্ট সফল হলে প্রাপ্ত ১০ অক্ষরের <strong>Transaction ID (TrxID)</strong> কপি করে নিন।</li>
                <li>নিচের বক্সে আপনার বিকাশ ওয়ালেট নম্বর এবং TrxID প্রদান করে সাবমিট করুন।</li>
              </ol>
            </div>

            <form onSubmit={handleBkashVerifySubmit} style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "20px" }}>
              <div className="form-group">
                <label className="form-label">যে বিকাশ নম্বর থেকে টাকা পাঠিয়েছেন</label>
                <input
                  type="text"
                  required
                  placeholder="উদাঃ ০১৭xxxxxxxx"
                  className="form-control"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">বিকাশ ট্রানজেকশন আইডি (TrxID)</label>
                <input
                  type="text"
                  required
                  placeholder="উদাঃ K8B7DFX9Z2"
                  className="form-control"
                  value={trxID}
                  onChange={(e) => setTrxID(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submittingTrx}
                className="btn btn-primary"
                style={{ width: "100%", background: "#e11d48", border: "none", padding: "12px", borderRadius: "12px" }}
              >
                {submittingTrx ? "সাবমিট করা হচ্ছে..." : "ট্রানজেকশন ভেরিফিকেশন সাবমিট করুন"}
              </button>
            </form>
          </div>
        )}

        {order.status === "processing" && (
          <div
            className="card"
            style={{ padding: "32px", textAlign: "center", border: "1px solid var(--primary)", marginBottom: "30px", background: "rgba(0, 88, 190, 0.02)" }}
          >
            <div style={{ marginBottom: "16px", display: "inline-flex", justifyContent: "center" }}>
              <WarningShield />
            </div>
            <h2 className="headline-sm" style={{ color: "var(--primary)", fontSize: "1.25rem", marginBottom: "12px" }}>
              পেমেন্ট ভেরিফিকেশন চলছে
            </h2>
            <p style={{ color: "var(--on-surface-variant)", fontSize: "0.95rem", lineHeight: "1.7", marginBottom: "16px", padding: "0 10px" }}>
              আপনার বিকাশ ট্রানজেকশন আইডি <strong>({order.bkashTrxID})</strong> আমাদের অ্যাডমিন প্যানেল থেকে মেলানো হচ্ছে। ভেরিফিকেশন সফল হলেই এই পেজে অটোমেটিক ডাউনলোড অপশন চালু হবে।
            </p>
            {trxSuccessMessage && <div style={{ color: "var(--tertiary)", fontWeight: "600", fontSize: "0.9rem", marginBottom: "12px" }}>{trxSuccessMessage}</div>}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--primary)", fontSize: "0.85rem", fontWeight: "600" }}>
              <div style={{ width: "14px", height: "14px", border: "2px solid var(--primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              পেমেন্ট চেক করা হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।
            </div>
          </div>
        )}

        {order.status === "pending" && order.paymentGateway === "eps" && (
          <div
            className="card"
            style={{ padding: "32px", textAlign: "center", border: "1px solid var(--primary)", marginBottom: "30px" }}
          >
            <h2 className="headline-sm" style={{ color: "var(--primary)", fontSize: "1.25rem", marginBottom: "12px" }}>
              ইপিএস পেমেন্ট গেটওয়ের সংকেতের জন্য অপেক্ষা করা হচ্ছে
            </h2>
            <p style={{ color: "var(--on-surface-variant)", fontSize: "0.95rem", marginBottom: "24px" }}>
              অটোমেটিক গেটওয়ে সিস্টেমে টেস্ট ট্রানজেকশনটি সম্পূর্ণ করতে নিচের বাটনে ক্লিক করে ইপিএস গেটওয়ের পেমেন্ট রিকোয়েস্টটি সিমুলেট করুনঃ
            </p>
            <button onClick={triggerMockEpsCallback} className="btn btn-primary" style={{ display: "inline-flex", margin: "0 auto" }}>
              পেমেন্ট রিকোয়েস্ট সিমুলেট করুন (Mock EPS Callback)
            </button>
          </div>
        )}

        {order.status === "paid" && (
          <div className="card" style={{ padding: "32px", border: "2px solid var(--tertiary)", marginBottom: "30px", background: "rgba(0, 131, 118, 0.01)" }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ marginBottom: "12px" }}>
                <SuccessShield />
              </div>
              <h2 className="headline-sm" style={{ color: "var(--tertiary)", fontSize: "1.35rem" }}>
                পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!
              </h2>
              <p style={{ color: "var(--on-surface-variant)", fontSize: "0.95rem", marginTop: "6px" }}>
                নিচে দেওয়া লিংক থেকে আপনার ক্রয়কৃত ডিজিটাল ফাইলটি সংগ্রহ করুনঃ
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "20px",
                    background: "var(--surface-low)",
                    borderRadius: "16px",
                    border: "1px solid var(--outline-variant)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                      <h4 style={{ fontWeight: "700", color: "var(--on-surface)" }}>{item.title}</h4>
                      <span className="badge badge-primary" style={{ fontSize: "0.7rem", marginTop: "6px" }}>
                        {item.type === "course" ? "ভিডিও কোর্স" : item.type === "pdf" ? "পিডিএফ বই" : "ডিজিটাল ফাইল"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                      {item.downloadUrl && (
                        <a
                          href={`${apiUrl}${item.downloadUrl}`}
                          download
                          className="btn btn-primary"
                          style={{ padding: "8px 16px", fontSize: "0.85rem", borderRadius: "8px" }}
                        >
                          <DownloadIcon /> ডাউনলোড করুন
                        </a>
                      )}
                      {item.deliveryLink && (
                        <a
                          href={item.deliveryLink}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: "8px 16px", fontSize: "0.85rem", borderRadius: "8px" }}
                        >
                          <LinkIcon /> সরাসরি দেখুন
                        </a>
                      )}
                      {!item.isWebDisplay && (
                        <span style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)", fontStyle: "italic" }}>
                          লিংকটি আপনার ইমেইল ঠিকানায় পাঠানো হয়েছে।
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a href="/" className="btn btn-secondary" style={{ display: "inline-block" }}>
            হোমপেজে ফিরে যান
          </a>
        </div>
      </main>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
