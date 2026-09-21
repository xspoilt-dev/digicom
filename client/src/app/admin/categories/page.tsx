"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useModal } from "@/context/ModalContext";
import {
  Folder,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Layers,
  Save,
  X,
  Sparkles,
} from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminCategoriesPage() {
  const { showConfirm, showAlert } = useModal();
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    order: 0,
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/admin/categories`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        setError(data.message || "ক্যাটাগরি লোড করতে ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setError("সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      order: categories.length > 0 ? Math.max(...categories.map((c) => c.order)) + 1 : 1,
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      order: cat.order,
      active: cat.active,
    });
    setIsModalOpen(true);
  };

  const handleSlugGenerate = (name: string) => {
    const generated = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({ ...prev, name, slug: prev.slug || generated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const url = editingCategory
        ? `${apiUrl}/api/admin/categories/${editingCategory._id}`
        : `${apiUrl}/api/admin/categories`;
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setSuccessMsg(editingCategory ? "ক্যাটাগরি সফলভাবে আপডেট হয়েছে!" : "নতুন ক্যাটাগরি তৈরি হয়েছে!");
        setTimeout(() => setSuccessMsg(""), 3000);
        fetchCategories();
      } else {
        setError(data.message || "অপারেশন সম্পন্ন করা যায়নি।");
      }
    } catch (err: any) {
      setError("অনুরোধ প্রক্রিয়াকরণ ব্যর্থ হয়েছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/categories/${cat._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ active: !cat.active }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) =>
          prev.map((c) => (c._id === cat._id ? { ...c, active: !c.active } : c))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderChange = async (cat: Category, newOrder: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/categories/${cat._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ order: newOrder }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirm({
      title: "ক্যাটাগরি ডিলিট",
      message: `আপনি কি নিশ্চিত যে "${name}" ক্যাটাগরি ডিলিট করতে চান?`,
      type: "warning",
      confirmText: "ডিলিট করুন",
      cancelText: "বাতিল",
      isDestructive: true,
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${apiUrl}/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => prev.filter((c) => c._id !== id));
        setSuccessMsg("ক্যাটাগরি ডিলিট হয়েছে।");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.message || "ডিলিট করা সম্ভব হয়নি।");
      }
    } catch (err) {
      setError("ডিলিট অনুরোধ ব্যর্থ হয়েছে।");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">ক্যাটাগরি ম্যানেজমেন্ট</h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
            হোমপেজে কোন ক্যাটাগরি আগে বা পরে দেখাবে তা এখান থেকে নিয়ন্ত্রণ করুন (PayloadCMS স্টাইল অর্ডার সিস্টেম)।
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold border-none rounded-xl px-5 shadow-sm text-xs sm:text-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          নতুন ক্যাটাগরি যোগ করুন
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="alert bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-2xl">
          <XCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Info Tip Banner */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 text-xs text-stone-700 space-y-1">
        <p className="font-bold text-stone-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" /> ক্রম বা সিরিয়াল নিয়ন্ত্রণ:
        </p>
        <p className="text-stone-600 leading-relaxed">
          Order সংখ্যা যার যত কম (১, ২, ৩...), হোমপেজে সেই ক্যাটাগরি ও তার পণ্য সবার উপরে দেখাবে। প্রতিটি ক্যাটাগরির নিজস্ব URL আছে (যেমন <code>/category/ai</code>) যা আপনি সরাসরি ফেসবুক বা গুগল অ্যাডে ব্যবহার করতে পারেন।
        </p>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <span className="loading loading-spinner loading-lg text-amber-500"></span>
            <span className="text-xs font-bold text-stone-500">ক্যাটাগরি তালিকা লোড হচ্ছে...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <Folder className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-800">কোনো ক্যাটাগরি তৈরি করা হয়নি</h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">উপরের বাটনে ক্লিক করে প্রথম ক্যাটাগরি যোগ করুন।</p>
            <button
              onClick={openCreateModal}
              className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold border-none rounded-xl btn-sm"
            >
              ক্যাটাগরি যোগ করুন
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-stone-50 text-stone-700 text-xs uppercase font-extrabold border-b border-stone-200">
                  <th className="py-4 px-4 w-20 text-center">ক্রম (Order)</th>
                  <th className="py-4 px-4">ক্যাটাগরির নাম ও বিবরণ</th>
                  <th className="py-4 px-4">ক্যাম্পেইন URL (Slug)</th>
                  <th className="py-4 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-4 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {categories.map((cat, idx) => (
                  <tr key={cat._id} className="hover:bg-stone-50/70 transition-colors">
                    {/* Order Controls */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOrderChange(cat, cat.order - 1)}
                          className="btn btn-ghost btn-xs btn-square hover:bg-amber-100 text-stone-600"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 h-7 rounded-lg bg-amber-100 text-stone-900 font-black flex items-center justify-center text-xs">
                          {cat.order}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOrderChange(cat, cat.order + 1)}
                          className="btn btn-ghost btn-xs btn-square hover:bg-amber-100 text-stone-600"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Name & Description */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-sm text-stone-900">{cat.name}</div>
                      {cat.description && (
                        <div className="text-stone-500 text-[11px] mt-0.5 line-clamp-1 max-w-md">
                          {cat.description}
                        </div>
                      )}
                    </td>

                    {/* Slug & Live Link */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs bg-stone-100 text-stone-800 px-2 py-1 rounded-md border border-stone-200">
                          {cat.slug}
                        </span>
                        <Link
                          href={`/category/${cat.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-400 hover:text-amber-600 p-1 transition-colors"
                          title="ওপেন লাইভ ক্যাটাগরি পেজ"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>

                    {/* Active Toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(cat)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                          cat.active
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                        }`}
                      >
                        {cat.active ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            সক্রিয় (Active)
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>
                            লুকানো (Inactive)
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="btn btn-ghost btn-xs rounded-lg hover:bg-amber-100 text-stone-700 font-bold px-2.5 flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                          এডিট
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat._id, cat.name)}
                          className="btn btn-ghost btn-xs rounded-lg hover:bg-red-100 text-red-600 font-bold px-2"
                          title="ডিলিট"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Create & Edit */}
      {mounted && isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Layers className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-black text-stone-900">
                  {editingCategory ? "ক্যাটাগরি এডিট করুন" : "নতুন ক্যাটাগরি তৈরি করুন"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost btn-sm btn-circle text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-stone-700">ক্যাটাগরির নাম *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: এআই টুলস ও সাবস্ক্রিপশন"
                  className="input input-bordered w-full rounded-xl bg-stone-50 border-stone-300 focus:border-amber-400 text-sm font-medium"
                  value={formData.name}
                  onChange={(e) => handleSlugGenerate(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-stone-700">
                    ক্যাম্পেইন URL স্ল্যাগ (Slug) *
                  </span>
                </label>
                <div className="flex items-center">
                  <span className="bg-stone-100 border border-r-0 border-stone-300 rounded-l-xl px-3 py-2 text-xs text-stone-500 font-mono">
                    /category/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="ai"
                    className="input input-bordered w-full rounded-r-xl rounded-l-none bg-stone-50 border-stone-300 focus:border-amber-400 text-sm font-mono"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().trim() })}
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1">
                  পণ্য যুক্ত করার সময় এই স্ল্যাগটি প্রোডাক্ট ক্যাটাগরিতে ব্যবহার করবেন।
                </span>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-stone-700">সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="হোমপেজে এই ক্যাটাগরির নামের নিচে ছোট বিবরণ দেখাবে..."
                  className="textarea textarea-bordered w-full rounded-xl bg-stone-50 border-stone-300 focus:border-amber-400 text-xs"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-stone-700">সিরিয়াল / ক্রম (Order) *</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="input input-bordered w-full rounded-xl bg-stone-50 border-stone-300 focus:border-amber-400 text-sm font-bold"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  />
                  <span className="text-[10px] text-stone-400 mt-1">কম সংখ্যা = আগে দেখাবে</span>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-stone-700">স্ট্যাটাস</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-stone-50 border border-stone-300 rounded-xl cursor-pointer mt-0.5">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="checkbox checkbox-warning checkbox-sm"
                    />
                    <span className="text-xs font-bold text-stone-800">হোমপেজে দেখান</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost rounded-xl text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold border-none rounded-xl px-5 text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  {submitting ? "সংরক্ষণ হচ্ছে..." : editingCategory ? "আপডেট করুন" : "ক্যাটাগরি তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
