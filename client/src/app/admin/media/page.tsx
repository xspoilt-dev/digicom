"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Image as ImageIcon,
  Upload,
  Search,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw,
  HardDrive,
  FileText,
  Check,
  Filter,
  Plus,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { useModal } from "@/context/ModalContext";

interface MediaItem {
  _id: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileType: "image" | "file" | "other";
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  folder?: string;
  createdAt: string;
}

export default function AdminMediaPage() {
  const { showAlert, showConfirm } = useModal();
  const apiUrl = getApiUrl();

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const loadMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (folderFilter !== "all") params.set("folder", folderFilter);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${apiUrl}/api/admin/media${qs}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.media)) {
        setMediaList(data.media);
        if (selectedItem) {
          const stillThere = data.media.find((m: MediaItem) => m._id === selectedItem._id);
          setSelectedItem(stillThere || null);
        }
      }
    } catch (err) {
      console.error("Error loading media:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [folderFilter]);

  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const fd = new FormData();
    for (let i = 0; i < files.length; i++) {
      fd.append("files", files[i]);
    }
    fd.append("folder", folderFilter === "products" ? "products" : "thumbnails");

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${apiUrl}/api/admin/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.media)) {
        await loadMedia();
        await showAlert({
          title: "Upload Successful",
          message: `${data.media.length} image(s) added to storage!`,
          type: "success",
        });
        if (data.media[0]) {
          setSelectedItem(data.media[0]);
        }
      } else {
        await showAlert({
          title: "Upload Failed",
          message: data.message || "Failed to upload files to media library.",
          type: "error",
        });
      }
    } catch (err: any) {
      await showAlert({
        title: "Upload Error",
        message: err.message || "Network error uploading media.",
        type: "error",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (item: MediaItem) => {
    const confirmed = await showConfirm({
      title: "Delete File from Storage?",
      message: `Are you sure you want to permanently delete "${item.originalName || item.filename}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${apiUrl}/api/admin/media/${item._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMediaList((prev) => prev.filter((m) => m._id !== item._id));
        if (selectedItem?._id === item._id) setSelectedItem(null);
      } else {
        await showAlert({
          title: "Delete Failed",
          message: data.message || "Could not delete media.",
          type: "error",
        });
      }
    } catch (err: any) {
      await showAlert({
        title: "Error",
        message: err.message || "Network error deleting media.",
        type: "error",
      });
    }
  };

  const handleCopyUrl = (item: MediaItem, isRelative: boolean = false) => {
    const textToCopy = isRelative
      ? item.filePath.replace(/^\/+/, "")
      : `${apiUrl}/${item.filePath.replace(/^\/+/, "")}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalSize = mediaList.reduce((acc, m) => acc + (m.size || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2.5">
            <HardDrive className="w-7 h-7 text-amber-500" /> Media Storage &amp; Asset Library
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Store, browse, and reuse product artwork and banners without re-uploading
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadMedia}
            className="btn btn-sm bg-stone-100 hover:bg-stone-200 text-stone-700 border-none rounded-xl font-bold flex items-center gap-1.5"
            title="Reload storage list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-sm bg-amber-400 hover:bg-amber-500 text-stone-950 font-black border-none rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            {uploading ? (
              <>
                <span className="loading loading-spinner loading-xs text-stone-950"></span>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Media</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Assets</div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 mt-1">{mediaList.length}</div>
        </div>
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Storage Used</div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1 font-mono">{formatFileSize(totalSize)}</div>
        </div>
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Auto-Optimization</div>
          <div className="text-base sm:text-lg font-black text-emerald-600 mt-1 flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> WebP 100%
          </div>
        </div>
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Reusability</div>
          <div className="text-base sm:text-lg font-black text-stone-800 mt-1">Unlimited</div>
        </div>
      </div>

      {/* Drag & Drop Upload Strip */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploadFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragOver
            ? "border-amber-500 bg-amber-50/70 scale-[1.01]"
            : "border-stone-300 hover:border-amber-400 bg-white hover:bg-stone-50/50 shadow-2xs"
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
          <Upload className="w-6 h-6" />
        </div>
        <h3 className="font-black text-sm text-stone-800">
          Drag &amp; drop images here or <span className="text-amber-600 underline">browse files</span>
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          Supports multiple uploads at once. Automatically converted to ultra-fast WebP format.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search media by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadMedia()}
            className="input input-sm input-bordered focus:border-amber-400 rounded-xl bg-stone-50 text-stone-900 text-xs pl-9 w-full"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <span>Folder:</span>
          </div>
          <select
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            className="select select-sm select-bordered focus:border-amber-400 rounded-xl bg-stone-50 text-stone-900 text-xs font-bold"
          >
            <option value="all">All Folders</option>
            <option value="thumbnails">Thumbnails</option>
            <option value="products">Products</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Media Grid */}
        <div className="flex-1 bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-6 shadow-xs">
          {loading && mediaList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-stone-400 gap-3">
              <span className="loading loading-spinner loading-lg text-amber-500"></span>
              <span className="text-xs font-semibold">Reading media storage...</span>
            </div>
          ) : mediaList.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-stone-900">No media found</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                Upload images using the drag-and-drop box above or clear your search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {mediaList.map((item) => {
                const isSelected = selectedItem?._id === item._id;
                const imgUrl = `${apiUrl}/${item.filePath.replace(/^\/+/, "")}`;

                return (
                  <div
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className={`group relative rounded-2xl border-2 overflow-hidden bg-stone-50 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-amber-500 ring-4 ring-amber-200 shadow-md bg-amber-50/40"
                        : "border-stone-200/90 hover:border-stone-400 hover:shadow-xs"
                    }`}
                  >
                    {/* Thumbnail Container */}
                    <div className="aspect-square w-full bg-white flex items-center justify-center p-2 relative overflow-hidden">
                      {item.fileType === "image" ? (
                        <img
                          src={imgUrl}
                          alt={item.originalName || item.filename}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      ) : (
                        <FileText className="w-12 h-12 text-stone-400" />
                      )}

                      {/* Selected Badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-2.5 bg-white border-t border-stone-100">
                      <div
                        className="text-[11px] font-bold text-stone-900 truncate"
                        title={item.originalName || item.filename}
                      >
                        {item.originalName || item.filename}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1 font-mono">
                        <span>{formatFileSize(item.size)}</span>
                        {item.width && item.height && (
                          <span>
                            {item.width}×{item.height}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Item Details Drawer */}
        {selectedItem && (
          <div className="lg:w-80 bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs h-fit sticky top-6 space-y-4">
            <h3 className="font-black text-sm text-stone-900 flex items-center justify-between">
              <span>Asset Information</span>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </h3>

            {/* Preview Box */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-2 aspect-square flex items-center justify-center overflow-hidden">
              {selectedItem.fileType === "image" ? (
                <img
                  src={`${apiUrl}/${selectedItem.filePath.replace(/^\/+/, "")}`}
                  alt={selectedItem.originalName}
                  className="w-full h-full object-contain bg-white rounded-xl"
                />
              ) : (
                <FileText className="w-16 h-16 text-stone-400" />
              )}
            </div>

            {/* Info Table */}
            <div className="space-y-2 text-xs bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-bold block">File Name</span>
                <span className="font-bold text-stone-900 break-words block">
                  {selectedItem.originalName || selectedItem.filename}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200/80">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">File Size</span>
                  <span className="font-mono text-stone-800 font-bold">{formatFileSize(selectedItem.size)}</span>
                </div>
                {selectedItem.width && selectedItem.height && (
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Dimensions</span>
                    <span className="font-mono text-stone-800 font-bold">
                      {selectedItem.width} × {selectedItem.height}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-1 border-t border-stone-200/80">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Relative Path</span>
                <span className="font-mono text-[10px] text-stone-600 break-all block">{selectedItem.filePath}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleCopyUrl(selectedItem, true)}
                className="btn btn-sm w-full bg-stone-100 hover:bg-stone-200 text-stone-800 border-none rounded-xl font-bold flex items-center justify-center gap-1.5"
              >
                {copiedId === selectedItem._id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Path Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Relative Path</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleCopyUrl(selectedItem, false)}
                className="btn btn-sm w-full bg-stone-100 hover:bg-stone-200 text-stone-800 border-none rounded-xl font-bold flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Copy Full CDN URL</span>
              </button>

              <a
                href={`${apiUrl}/${selectedItem.filePath.replace(/^\/+/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm w-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl font-bold flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Full Resolution</span>
              </a>

              <button
                type="button"
                onClick={() => handleDelete(selectedItem)}
                className="btn btn-sm w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-center justify-center gap-1.5 pt-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete from Storage</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
