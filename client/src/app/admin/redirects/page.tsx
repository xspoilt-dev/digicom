"use client";

import { useEffect, useState } from "react";

interface RedirectRoute {
  _id?: string;
  sourcePath: string;
  destinationPath: string;
  redirectType: "rewrite" | "redirect";
}

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<RedirectRoute[]>([]);
  const [newRedirect, setNewRedirect] = useState<RedirectRoute>({ sourcePath: "", destinationPath: "", redirectType: "rewrite" });
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchRedirects();
  }, [apiUrl]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchRedirects = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/redirects`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setRedirects(data.redirects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRedirect.sourcePath || !newRedirect.destinationPath) return;

    try {
      const res = await fetch(`${apiUrl}/api/admin/redirects`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newRedirect),
      });
      const data = await res.json();
      if (data.success) {
        alert("Redirect rule saved successfully.");
        setNewRedirect({ sourcePath: "", destinationPath: "", redirectType: "rewrite" });
        fetchRedirects();
      }
    } catch (err) {
      alert("Error saving redirect rule.");
    }
  };

  const deleteRedirect = async (id: string) => {
    if (!confirm("Are you sure you want to delete this redirect route?")) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/redirects/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        alert("Redirect route deleted.");
        fetchRedirects();
      }
    } catch (err) {
      alert("Error deleting redirect rule.");
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
        <h1 className="text-3xl font-black text-base-content">Dynamic Router</h1>
        <p className="text-xs text-base-content/65 font-semibold mt-1">Mask internal routes or trigger direct 302 redirects</p>
      </div>

      {/* Create Redirect form widget */}
      <div className="card bg-base-100 border border-base-300 p-6 rounded-2xl shadow-sm">
        <h3 className="text-base font-extrabold text-base-content mb-4">
          Create Redirect Route
        </h3>
        <form onSubmit={handleRedirectSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold text-base-content/85">Source Path (Trigger)</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. /laravel"
              className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
              value={newRedirect.sourcePath}
              onChange={(e) => setNewRedirect({ ...newRedirect, sourcePath: e.target.value })}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold text-base-content/85">Destination Path</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. /shop?search=laravel"
              className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
              value={newRedirect.destinationPath}
              onChange={(e) => setNewRedirect({ ...newRedirect, destinationPath: e.target.value })}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold text-base-content/85">Redirect Type</span>
            </label>
            <select
              className="select select-bordered focus:select-primary rounded-xl text-base-content bg-base-100 w-full"
              value={newRedirect.redirectType}
              onChange={(e) => setNewRedirect({ ...newRedirect, redirectType: e.target.value as any })}
            >
              <option value="rewrite">Rewrite (Mask URL)</option>
              <option value="redirect">302 Direct Redirect</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary rounded-xl font-bold shadow-md w-full">
            Create Rule
          </button>
        </form>
      </div>

      {/* Display table of rules */}
      <div className="card bg-base-100 border border-base-300 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full text-sm">
            <thead>
              <tr className="border-b border-base-300 text-base-content/80 font-bold">
                <th>Source Path</th>
                <th>Destination Target</th>
                <th>Method</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {redirects.length > 0 ? (
                redirects.map((r) => (
                  <tr key={r._id} className="border-b border-base-200">
                    <td className="font-mono font-bold text-primary text-sm">{r.sourcePath}</td>
                    <td className="text-sm font-semibold">{r.destinationPath}</td>
                    <td>
                      <span className="badge badge-sm font-bold uppercase">{r.redirectType}</span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => deleteRedirect(r._id!)}
                        className="btn btn-xs btn-outline btn-error rounded-full font-bold px-3"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-base-content/50">No router redirect paths configured yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
