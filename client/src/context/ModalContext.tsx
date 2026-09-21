"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

export type ModalType = "success" | "error" | "warning" | "info";

export interface AlertOptions {
  title?: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface ModalState {
  isOpen: boolean;
  isConfirm: boolean;
  title: string;
  message: string;
  type: ModalType;
  confirmText: string;
  cancelText: string;
  isDestructive: boolean;
  resolve?: (value: any) => void;
}

interface ModalContextType {
  showAlert: (options: string | AlertOptions) => Promise<void>;
  showConfirm: (options: string | ConfirmOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    isConfirm: false,
    title: "",
    message: "",
    type: "info",
    confirmText: "OK",
    cancelText: "Cancel",
    isDestructive: false,
  });

  const [mounted, setMounted] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showAlert = useCallback((options: string | AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof options === "string") {
        setModal({
          isOpen: true,
          isConfirm: false,
          title: "Notification",
          message: options,
          type: "info",
          confirmText: "OK",
          cancelText: "Cancel",
          isDestructive: false,
          resolve,
        });
      } else {
        setModal({
          isOpen: true,
          isConfirm: false,
          title: options.title || (options.type === "error" ? "Error" : options.type === "success" ? "Success" : "Notification"),
          message: options.message,
          type: options.type || "info",
          confirmText: options.confirmText || "OK",
          cancelText: "Cancel",
          isDestructive: false,
          resolve,
        });
      }
    });
  }, []);

  const showConfirm = useCallback((options: string | ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof options === "string") {
        setModal({
          isOpen: true,
          isConfirm: true,
          title: "Confirmation",
          message: options,
          type: "warning",
          confirmText: "Confirm",
          cancelText: "Cancel",
          isDestructive: false,
          resolve,
        });
      } else {
        setModal({
          isOpen: true,
          isConfirm: true,
          title: options.title || "Confirmation",
          message: options.message,
          type: options.type || "warning",
          confirmText: options.confirmText || "Confirm",
          cancelText: options.cancelText || "Cancel",
          isDestructive: Boolean(options.isDestructive),
          resolve,
        });
      }
    });
  }, []);

  // Global window.alert fallback replacement
  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalAlert = window.alert;
    window.alert = (msg: any) => {
      showAlert(String(msg));
    };
    return () => {
      window.alert = originalAlert;
    };
  }, [showAlert]);

  const handleConfirm = () => {
    if (modal.resolve) {
      modal.resolve(modal.isConfirm ? true : undefined);
    }
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (modal.resolve) {
      modal.resolve(modal.isConfirm ? false : undefined);
    }
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Keyboard navigation
  useEffect(() => {
    if (!modal.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      } else if (e.key === "Enter" && !e.shiftKey) {
        // Confirm if not focused on cancel button
        if (document.activeElement?.getAttribute("data-modal-cancel") === "true") {
          return;
        }
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modal.isOpen, modal.resolve, modal.isConfirm]);

  // Focus confirm button when opened
  useEffect(() => {
    if (modal.isOpen) {
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
    }
  }, [modal.isOpen]);

  const renderIcon = () => {
    switch (modal.type) {
      case "success":
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        );
      case "error":
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
        );
      case "warning":
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case "info":
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Info className="w-6 h-6" />
          </div>
        );
    }
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {mounted &&
        modal.isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn"
            onClick={handleCancel}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative w-full max-w-md bg-white rounded-3xl border-2 border-stone-200 shadow-2xl p-6 sm:p-7 text-stone-900 my-auto transform transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Close */}
              <div className="flex items-start gap-4 mb-4">
                {renderIcon()}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-lg font-black text-stone-900 tracking-tight leading-snug">
                    {modal.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-sm btn-ghost btn-circle text-stone-400 hover:text-stone-700 -mr-2 -mt-2"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message */}
              <div className="text-stone-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line break-words pl-0 sm:pl-16 mb-6 font-medium">
                {modal.message}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
                {modal.isConfirm && (
                  <button
                    type="button"
                    data-modal-cancel="true"
                    onClick={handleCancel}
                    className="btn btn-sm bg-stone-100 hover:bg-stone-200 text-stone-700 border-none rounded-xl font-bold px-4"
                  >
                    {modal.cancelText}
                  </button>
                )}
                <button
                  ref={confirmBtnRef}
                  type="button"
                  onClick={handleConfirm}
                  className={`btn btn-sm rounded-xl font-bold px-6 border-none shadow-xs transition-colors ${
                    modal.isDestructive
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-amber-400 hover:bg-amber-500 text-stone-950"
                  }`}
                >
                  {modal.confirmText}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
