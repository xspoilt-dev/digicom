"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, MessageCircle } from "lucide-react";
import { getApiUrl } from "@/lib/api";

export default function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  const apiUrl = getApiUrl();

  useEffect(() => {
    setMounted(true);
    async function loadWhatsappInfo() {
      try {
        const res = await fetch(`${apiUrl}/api/settings/public`);
        const data = await res.json();
        if (data.success && data.companyInfo) {
          const num = data.companyInfo.whatsapp || data.companyInfo.whatsappNumber;
          if (num) setWhatsappNumber(num);
        }
      } catch {
        // Fallback to default
      }
    }
    loadWhatsappInfo();
  }, [apiUrl]);

  // Do not show on admin panel pages
  if (!mounted || pathname.startsWith("/admin")) {
    return null;
  }

  // Format clean WhatsApp number for Bangladesh (e.g., 017XXXXXXXX -> 88017XXXXXXXX)
  const rawNumber = whatsappNumber || "01700000000";
  let cleanNumber = rawNumber.replace(/\D/g, "");
  if (cleanNumber.length === 11 && cleanNumber.startsWith("01")) {
    cleanNumber = "88" + cleanNumber;
  } else if (cleanNumber.length === 10 && cleanNumber.startsWith("1")) {
    cleanNumber = "880" + cleanNumber;
  }

  // Generate contextual pre-filled message
  let messageText = "হ্যালো Kalobazar.shop, আমি একটি সার্ভিস সম্পর্কে জানতে চাচ্ছি।";
  if (typeof window !== "undefined" && pathname.startsWith("/product/")) {
    messageText = `হ্যালো Kalobazar.shop, আমি এই প্রোডাক্টটি সম্পর্কে জানতে চাচ্ছি: ${window.location.href}`;
  }

  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`;

  return (
    <div
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2 group animate-fadeIn"
      style={{ isolation: "isolate" }}
    >
      {/* Interactive Chat Helper Tooltip */}
      {showTooltip && (
        <div className="flex items-center gap-2 bg-stone-900/95 backdrop-blur-md text-white text-xs font-semibold px-3 py-2 rounded-2xl shadow-xl border border-stone-800 animate-bounce duration-1000 max-w-[230px] sm:max-w-none">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors cursor-pointer"
          >
            সরাসরি WhatsApp-এ কথা বলুন
          </a>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="text-stone-400 hover:text-white p-0.5 rounded-full hover:bg-stone-800 transition-colors ml-1 cursor-pointer"
            aria-label="Dismiss tooltip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg hover:shadow-2xl hover:scale-108 active:scale-95 transition-all flex items-center justify-center group-hover:rotate-6 cursor-pointer"
        aria-label="Contact us on WhatsApp"
        title="WhatsApp Support"
      >
        {/* Pulse Ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25"></span>

        {/* Online Status Dot */}
        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full z-10"></span>

        {/* WhatsApp Official Vector Logo */}
        <svg
          viewBox="0 0 24 24"
          width="30"
          height="30"
          fill="currentColor"
          className="w-7 h-7 fill-white drop-shadow-xs"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
}
