"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Image as ImageIcon,
  Upload,
  Search,
  Check,
  X,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw,
  HardDrive,
  FileText,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { useModal } from "@/context/ModalContext";

export interface MediaItem {
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

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (filePath: string, mediaItem?: MediaItem) => void;
  title?: string;
  filterType?: "image" | "file" | "all";
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = "Select from Media Storage",
  filterType = "image",
}: MediaPickerModalProps) {
  const { showAlert, showConfirm } = useModal();
  const apiUrl = getApiUrl();

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const q = searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : "";
      const res = await fetch(`${apiUrl}/api/admin/media${q}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.media)) {
        setMediaList(data.media);
        if (selectedItem) {
          const stillExists = data.media.find((m: MediaItem) => m._id === selectedItem._id);
          if (!stillExists) setSelectedItem(null);
        }
      }
    } catch (err) {
      console.error("Error fetching media storage:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    } else {
      setSelectedItem(null);
    }
  }, [isOpen]);

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const fd = new FormData();
    for (let i = 0; i < files.length; i++) {
      fd.append("files", files[i]);
    }
    fd.append("folder", "thumbnails");

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${apiUrl}/api/admin/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.media) && data.media.length > 0) {
        await fetchMedia();
        // Auto-select the newly uploaded file
        setSelectedItem(data.media[0]);
      } else {
        await showAlert({
          title: "Upload Failed",
          message: data.message || "Could not upload files to media storage.",
          type: "error",
        });
      }
    } catch (err: any) {
      await showAlert({
        title: "Upload Error",
        message: err.message || "Failed to reach server during upload.",
        type: "error",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteItem = async (item: MediaItem) => {
    const confirmed = await showConfirm({
      title: "Delete File from Storage?",
      message: `Are you sure you want to permanently delete "${item.originalName || item.filename}"? This will break any products currently using this image URL.`,
      confirmText: "Delete Permanently",
      cancelText: "Keep File",
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
          message: data.message || "Could not delete file.",
          type: "error",
        });
      }
    } catch (err: any) {
      await showAlert({
        title: "Error",
        message: err.message || "Could not delete media.",
        type: "error",
      });
    }
  };

  const handleCopyUrl = (item: MediaItem) => {
    const fullUrl = `${apiUrl}/${item.filePath.replace(/^\/+/, "")}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(item._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const filteredMedia = mediaList.filter((m) => {
    if (filterType === "image" && m.fileType !== "image") return false;
    if (filterType === "file" && m.fileType !== "file") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.originalName?.toLowerCase().includes(q) ||
        m.filename?.toLowerCase().includes(q) ||
        m.filePath?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-stone-950/75 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-5xl bg-white rounded-3xl border-2 border-stone-200 shadow-2xl text-stone-900 my-auto h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-stone-900 leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Reusable media storage &amp; image assets library ({filteredMedia.length} files)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-sm bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
            >
              {uploading ? (
                <>
                  <span className="loading loading-spinner loading-xs text-stone-950"></span>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload Images</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUploadFiles}
            />

            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-ghost btn-circle text-stone-400 hover:text-stone-700 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Refresh */}
        <div className="p-3 sm:p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search media by filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchMedia()}
              className="input input-sm input-bordered focus:border-amber-400 rounded-xl bg-white text-stone-900 text-xs pl-9 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchMedia}
              className="btn btn-sm btn-ghost text-stone-600 hover:text-stone-900 rounded-xl flex items-center gap-1"
              title="Refresh media list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline text-xs font-bold">Refresh</span>
            </button>
          </div>
        </div>

        {/* Body: Split View (Grid + Details Drawer) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Media Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading && mediaList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
                <span className="loading loading-spinner loading-md text-amber-500"></span>
                <span className="text-xs font-semibold">Loading media storage...</span>
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-stone-200 rounded-3xl p-8 bg-stone-50/50">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-stone-800">No media assets found</h4>
                <p className="text-xs text-stone-500 max-w-sm mt-1 mb-4">
                  {searchQuery
                    ? `No media matches "${searchQuery}". Clear your search or upload a new file.`
                    : "Your media storage is currently empty. Upload product banners and artwork to reuse them anytime without re-uploading."}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-sm bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold border-none rounded-xl"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload First Image
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {filteredMedia.map((item) => {
                  const isSelected = selectedItem?._id === item._id;
                  const imgUrl = `${apiUrl}/${item.filePath.replace(/^\/+/, "")}`;

                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedItem(item)}
                      onDoubleClick={() => {
                        onSelect(item.filePath, item);
                        onClose();
                      }}
                      className={`group relative rounded-2xl border-2 overflow-hidden bg-stone-50 cursor-pointer transition-all flex flex-col justify-between select-none ${
                        isSelected
                          ? "border-amber-500 ring-4 ring-amber-200 shadow-md bg-amber-50/30"
                          : "border-stone-200 hover:border-stone-400 hover:shadow-xs"
                      }`}
                    >
                      {/* Image Thumbnail */}
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

                        {/* Selected Indicator Badge */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Info Footer */}
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

          {/* Right: Selected File Inspector */}
          {selectedItem && (
            <div className="w-72 sm:w-80 border-l border-stone-200 bg-stone-50/80 p-5 overflow-y-auto flex flex-col justify-between shrink-0 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-500 uppercase tracking-wider">
                    File Details
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Preview Card */}
                <div className="rounded-2xl border border-stone-200 bg-white p-2 aspect-video flex items-center justify-center overflow-hidden shadow-2xs">
                  {selectedItem.fileType === "image" ? (
                    <img
                      src={`${apiUrl}/${selectedItem.filePath.replace(/^\/+/, "")}`}
                      alt={selectedItem.originalName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <FileText className="w-12 h-12 text-stone-400" />
                  )}
                </div>

                {/* Metadata List */}
                <div className="space-y-2 text-xs bg-white p-3 rounded-2xl border border-stone-200">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">
                      Name
                    </span>
                    <span className="font-bold text-stone-900 break-words block">
                      {selectedItem.originalName || selectedItem.filename}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">
                        Size
                      </span>
                      <span className="font-mono text-stone-800 font-bold">
                        {formatFileSize(selectedItem.size)}
                      </span>
                    </div>
                    {selectedItem.width && selectedItem.height && (
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">
                          Dimensions
                        </span>
                        <span className="font-mono text-stone-800 font-bold">
                          {selectedItem.width}×{selectedItem.height}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-1 border-t border-stone-100">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">
                      Type
                    </span>
                    <span className="font-mono text-[11px] text-stone-600 block">
                      {selectedItem.mimeType}
                    </span>
                  </div>

                  <div className="pt-1 border-t border-stone-100">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">
                      Path
                    </span>
                    <span className="font-mono text-[10px] text-stone-500 break-all block">
                      {selectedItem.filePath}
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(selectedItem)}
                    className="btn btn-xs flex-1 bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 rounded-xl font-bold flex items-center justify-center gap-1 shadow-2xs"
                  >
                    {copiedId === selectedItem._id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`${apiUrl}/${selectedItem.filePath.replace(/^\/+/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-xs bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 rounded-xl font-bold flex items-center justify-center gap-1 shadow-2xs"
                    title="Open full image in new tab"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(selectedItem)}
                    className="btn btn-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-center justify-center gap-1"
                    title="Delete permanently from storage"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Select & Use Action Button */}
              <button
                type="button"
                onClick={() => {
                  onSelect(selectedItem.filePath, selectedItem);
                  onClose();
                }}
                className="btn bg-amber-400 hover:bg-amber-500 text-stone-950 font-black border-none rounded-2xl w-full shadow-md py-3 text-xs flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Use This Image</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-100 bg-white flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-500">
            {selectedItem ? (
              <span className="text-stone-800 font-bold">
                Selected: <span className="font-mono">{selectedItem.originalName || selectedItem.filename}</span>
              </span>
            ) : (
              <span>Click on any image to inspect or choose it</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm bg-stone-100 hover:bg-stone-200 text-stone-700 border-none rounded-xl font-bold px-4"
            >
              Cancel
            </button>
            {selectedItem && (
              <button
                type="button"
                onClick={() => {
                  onSelect(selectedItem.filePath, selectedItem);
                  onClose();
                }}
                className="btn btn-sm bg-amber-400 hover:bg-amber-500 text-stone-950 border-none rounded-xl font-black px-6 shadow-sm"
              >
                Insert Selected
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
