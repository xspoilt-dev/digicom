"use client";

import { useEffect, useState } from "react";

interface Transaction {
  _id: string;
  orderId: { orderId: string; email?: string; phone?: string; total?: number };
  amount: number;
  gateway: "bkash" | "eps";
  trxID: string;
  senderNumber?: string;
  status: "pending" | "verified" | "failed";
  createdAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchTransactions();
  }, [apiUrl]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/transactions`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setTransactions(data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-black text-base-content">Ledger / Transactions</h1>
        <p className="text-xs text-base-content/65 font-semibold mt-1">Audit log of payments verified by CAPI or manual approval</p>
      </div>

      <div className="card bg-base-100 border border-base-300 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full text-sm">
            <thead>
              <tr className="border-b border-base-300 text-base-content/80 font-bold">
                <th>TrxID</th>
                <th>Order Code</th>
                <th>Gateway</th>
                <th>Sender Number</th>
                <th>Settled Amount</th>
                <th>Timestamp</th>
                <th>Validation</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr key={t._id} className="border-b border-base-200">
                    <td className="font-mono font-bold text-base-content">{t.trxID}</td>
                    <td className="font-mono font-bold text-base-content">{t.orderId?.orderId || "N/A"}</td>
                    <td className="uppercase text-xs font-semibold">{t.gateway}</td>
                    <td className="font-mono text-xs">{t.senderNumber || "Automated Link"}</td>
                    <td className="font-black text-primary">৳{t.amount}</td>
                    <td className="text-xs text-base-content/60">{new Date(t.createdAt).toLocaleString()}</td>
                    <td>
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
                  <td colSpan={7} className="text-center py-8 text-base-content/50">No transactions recorded in payment ledger yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
