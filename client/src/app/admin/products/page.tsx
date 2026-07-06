"use client";

import { useEffect, useState } from "react";

interface Product {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  type: "course" | "pdf" | "video" | "zip" | "other";
  filePath?: string;
  deliveryLink?: string;
  thumbnailPath?: string;
  duration?: string;
  pageCount?: number;
  version?: string;
  checkoutFields: string[];
  isEmailDelivery: boolean;
  isWebDisplay: boolean;
  curriculum: { title: string; duration?: string }[];
  active: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [curriculumTitle, setCurriculumTitle] = useState("");
  const [curriculumDuration, setCurriculumDuration] = useState("");

  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchProducts();
  }, [apiUrl]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/products`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openProductCreate = () => {
    setSelectedProduct({
      title: "",
      slug: "",
      description: "",
      price: 0,
      type: "pdf",
      checkoutFields: ["name", "email", "phone"],
      isEmailDelivery: true,
      isWebDisplay: true,
      curriculum: [],
      active: true,
    });
    setIsProductModalOpen(true);
  };

  const openProductEdit = (product: Product) => {
    setSelectedProduct({ ...product });
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const method = selectedProduct._id ? "PUT" : "POST";
      const path = selectedProduct._id ? `/api/admin/products/${selectedProduct._id}` : "/api/admin/products";

      const res = await fetch(`${apiUrl}${path}`, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(selectedProduct),
      });
      const data = await res.json();
      if (data.success) {
        alert("Product saved successfully.");
        setIsProductModalOpen(false);
        fetchProducts();
      } else {
        alert(data.message || "Failed to save product.");
      }
    } catch (err) {
      alert("Error saving product.");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/products/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        alert("Product deleted.");
        fetchProducts();
      }
    } catch (err) {
      alert("Error deleting product.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isThumbnail: boolean) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProduct) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", isThumbnail ? "thumbnail" : "product-file");

    if (isThumbnail) setUploadingThumbnail(true);
    else setUploadingFile(true);

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${apiUrl}/api/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        if (isThumbnail) {
          setSelectedProduct({ ...selectedProduct, thumbnailPath: data.filePath });
        } else {
          setSelectedProduct({ ...selectedProduct, filePath: data.filePath });
        }
        alert("File uploaded successfully.");
      } else {
        alert(data.message || "File upload failed.");
      }
    } catch (err) {
      alert("Error during upload.");
    } finally {
      if (isThumbnail) setUploadingThumbnail(false);
      else setUploadingFile(false);
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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-base-content">Product Catalog</h1>
          <p className="text-xs text-base-content/65 font-semibold mt-1">Manage and add digital goods, courses, and PDFs</p>
        </div>
        <button onClick={openProductCreate} className="btn btn-primary rounded-full font-bold shadow-md">
          + Create Digital Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length > 0 ? (
          products.map((p) => (
            <div key={p._id} className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all rounded-2xl">
              <div className="card-body p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center gap-2 mb-3">
                    <span className="badge badge-outline font-bold text-xs uppercase">
                      {p.type}
                    </span>
                    <span className="font-black text-lg text-primary">৳{p.price}</span>
                  </div>
                  <h3 className="card-title text-base-content text-base font-bold line-clamp-1 mb-2">
                    {p.title}
                  </h3>
                  <p className="text-xs text-base-content/70 line-clamp-3 mb-6">
                    {p.description}
                  </p>
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t border-base-200">
                  <button onClick={() => openProductEdit(p)} className="btn btn-sm btn-outline rounded-full font-bold flex-1 text-xs">
                    Edit Details
                  </button>
                  <button
                    onClick={() => deleteProduct(p._id!)}
                    className="btn btn-sm btn-outline btn-error rounded-full font-bold flex-1 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-base-content/50 bg-base-100 rounded-2xl border border-base-300">
            No digital products added to store catalog yet.
          </div>
        )}
      </div>

      {/* CREATE / EDIT PRODUCT DETAIL MODAL */}
      {isProductModalOpen && selectedProduct && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl max-w-2xl border border-base-300 shadow-2xl relative bg-base-100 text-base-content">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            
            <h3 className="font-black text-xl text-base-content mb-6 border-b border-base-200 pb-3">
              {selectedProduct._id ? "Edit Product Details" : "Create New Digital Product"}
            </h3>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold text-base-content/85">Product Title / Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                    value={selectedProduct.title}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, title: e.target.value })}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold text-base-content/85">URL Route Slug (Unique)</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                    value={selectedProduct.slug}
                    placeholder="e.g. laravel-guide-book"
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold text-base-content/85">Short Description</span>
                </label>
                <textarea
                  required
                  rows={3}
                  className="textarea textarea-bordered focus:textarea-primary rounded-xl text-base-content bg-base-100 w-full"
                  value={selectedProduct.description}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold text-base-content/85">Price (BDT)</span>
                  </label>
                  <input
                    type="number"
                    required
                    className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                    value={selectedProduct.price}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, price: Number(e.target.value) })}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold text-base-content/85">Compare at Price (BDT)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                    value={selectedProduct.compareAtPrice || ""}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, compareAtPrice: Number(e.target.value) || undefined })}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold text-base-content/85">Category</span>
                  </label>
                  <select
                    className="select select-bordered focus:select-primary rounded-xl text-base-content bg-base-100 w-full"
                    value={selectedProduct.type}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, type: e.target.value as any })}
                  >
                    <option value="course">Video Course</option>
                    <option value="pdf">PDF Book</option>
                    <option value="video">Video Guide</option>
                    <option value="zip">ZIP File</option>
                    <option value="other">Other File</option>
                  </select>
                </div>
              </div>

              {/* Dynamic configs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedProduct.type === "course" || selectedProduct.type === "video") && (
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-bold text-base-content/85">Total Video Duration (e.g. 5h 40m)</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                      value={selectedProduct.duration || ""}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, duration: e.target.value })}
                    />
                  </div>
                )}

                {selectedProduct.type === "pdf" && (
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-bold text-base-content/85">Page Count</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                      value={selectedProduct.pageCount || ""}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, pageCount: Number(e.target.value) })}
                    />
                  </div>
                )}

                {selectedProduct.type === "zip" && (
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-bold text-base-content/85">Software Version (e.g. v1.0)</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                      value={selectedProduct.version || ""}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, version: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Delivery info */}
              <div className="border border-base-300 rounded-2xl p-5 space-y-4">
                <span className="font-extrabold text-sm text-base-content block">Secure File Delivery</span>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold text-base-content/80">Upload File to Server</span>
                  </label>
                  <input
                    type="file"
                    className="file-input file-input-bordered focus:file-input-primary rounded-xl w-full"
                    onChange={(e) => handleFileUpload(e, false)}
                  />
                  {uploadingFile && <span className="text-xs text-primary mt-1">Writing file to disk...</span>}
                  {selectedProduct.filePath && (
                    <span className="text-xs text-success font-bold mt-1">✓ File URL: {selectedProduct.filePath}</span>
                  )}
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold text-base-content/80">Or External Download Link</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/download"
                    className="input input-bordered focus:input-primary rounded-xl text-base-content bg-base-100 w-full"
                    value={selectedProduct.deliveryLink || ""}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, deliveryLink: e.target.value })}
                  />
                </div>
              </div>

              {/* Thumbnail info */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold text-base-content/85">Product Cover Thumbnail Image</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered focus:file-input-primary rounded-xl w-full"
                  onChange={(e) => handleFileUpload(e, true)}
                />
                {uploadingThumbnail && <span className="text-xs text-primary mt-1">Uploading thumbnail...</span>}
                {selectedProduct.thumbnailPath && (
                  <span className="text-xs text-success font-bold mt-1">✓ Thumbnail URL: {selectedProduct.thumbnailPath}</span>
                )}
              </div>

              {/* Checkboxes */}
              <div className="border border-base-300 rounded-2xl p-5 space-y-4">
                <span className="font-extrabold text-sm text-base-content block">Delivery Options & Forms</span>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-xs"
                      checked={selectedProduct.isEmailDelivery}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, isEmailDelivery: e.target.checked })}
                    />
                    Send Link via Email
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-xs"
                      checked={selectedProduct.isWebDisplay}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, isWebDisplay: e.target.checked })}
                    />
                    Show Download Button on Thank-You page
                  </label>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-base-content/80 block">Required Guest Checkout Fields:</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={selectedProduct.checkoutFields.includes("name")}
                        onChange={(e) => {
                          const fields = e.target.checked
                            ? [...selectedProduct.checkoutFields, "name"]
                            : selectedProduct.checkoutFields.filter((f) => f !== "name");
                          setSelectedProduct({ ...selectedProduct, checkoutFields: fields });
                        }}
                      />
                      Name
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={selectedProduct.checkoutFields.includes("email")}
                        onChange={(e) => {
                          const fields = e.target.checked
                            ? [...selectedProduct.checkoutFields, "email"]
                            : selectedProduct.checkoutFields.filter((f) => f !== "email");
                          setSelectedProduct({ ...selectedProduct, checkoutFields: fields });
                        }}
                      />
                      Email
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={selectedProduct.checkoutFields.includes("phone")}
                        onChange={(e) => {
                          const fields = e.target.checked
                            ? [...selectedProduct.checkoutFields, "phone"]
                            : selectedProduct.checkoutFields.filter((f) => f !== "phone");
                          setSelectedProduct({ ...selectedProduct, checkoutFields: fields });
                        }}
                      />
                      Phone Number
                    </label>
                  </div>
                </div>
              </div>

              {/* Lesson Curriculum */}
              {selectedProduct.type === "course" && (
                <div className="border border-base-300 rounded-2xl p-5 space-y-4">
                  <span className="font-extrabold text-sm text-base-content block">Course Lesson Curriculum Setup</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Chapter 1: Introduction"
                      className="input input-bordered focus:input-primary rounded-xl flex-1 text-sm bg-base-100 text-base-content w-full"
                      value={curriculumTitle}
                      onChange={(e) => setCurriculumTitle(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="e.g. 12m 45s"
                      className="input input-bordered focus:input-primary rounded-xl w-32 text-sm bg-base-100 text-base-content w-full"
                      value={curriculumDuration}
                      onChange={(e) => setCurriculumDuration(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline font-bold text-xs"
                      onClick={() => {
                        if (!curriculumTitle) return;
                        const curr = [...selectedProduct.curriculum, { title: curriculumTitle, duration: curriculumDuration }];
                        setSelectedProduct({ ...selectedProduct, curriculum: curr });
                        setCurriculumTitle("");
                        setCurriculumDuration("");
                      }}
                    >
                      Add Lesson
                    </button>
                  </div>
                  <ul className="text-xs space-y-2 max-h-40 overflow-y-auto pl-4 list-disc">
                    {selectedProduct.curriculum.map((item, idx) => (
                      <li key={idx}>
                        <span className="font-semibold text-base-content">{item.title}</span> {item.duration && `(${item.duration})`}
                        <button
                          type="button"
                          className="text-error font-extrabold ml-3 hover:underline"
                          onClick={() => {
                            const curr = selectedProduct.curriculum.filter((_, i) => i !== idx);
                            setSelectedProduct({ ...selectedProduct, curriculum: curr });
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button type="submit" className="btn btn-primary w-full rounded-xl font-bold shadow-lg mt-4">
                Save Product to Catalog
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
