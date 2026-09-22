"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";

export default function Footer() {
  const [companyInfo, setCompanyInfo] = useState<{
    name?: string;
    email?: string;
    whatsapp?: string;
    whatsappNumber?: string;
    bkashNumber?: string;
  }>({});

  const apiUrl = getApiUrl();

  useEffect(() => {
    async function fetchPublicSettings() {
      try {
        const res = await fetch(`${apiUrl}/api/settings/public`);
        const data = await res.json();
        if (data.success && data.companyInfo) {
          setCompanyInfo(data.companyInfo);
        }
      } catch {
        // Fallback gracefully
      }
    }
    fetchPublicSettings();
  }, [apiUrl]);

  // Clean WhatsApp number to form proper wa.me link
  const rawWhatsapp = companyInfo.whatsapp || companyInfo.whatsappNumber || "01700000000";
  let cleanNumber = rawWhatsapp.replace(/\D/g, "");
  if (cleanNumber.length === 11 && cleanNumber.startsWith("01")) {
    cleanNumber = "88" + cleanNumber;
  }
  const whatsappUrl = `https://wa.me/${cleanNumber}`;

  return (
    <footer className="bg-white text-stone-800 border-t border-stone-200/90 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand Logo and Copyright */}
        <aside className="flex flex-col sm:flex-row items-center gap-3">
          <Link href="/" className="inline-block group" aria-label="Kalobazar.shop">
            <img
              src="/horizontal.png"
              alt={companyInfo.name || "Kalobazar.shop"}
              className="h-9 w-auto object-contain group-hover:opacity-90 transition-opacity"
            />
          </Link>
          <div className="flex items-center gap-2 sm:border-l sm:border-stone-200 sm:pl-3">
            <p className="text-xs text-stone-500">
              © ২০২৬ {companyInfo.name || "Kalobazar.shop"}. সর্বস্বত্ব সংরক্ষিত।
            </p>
            <span className="bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[9px] uppercase px-2 py-0.5 rounded-full">
              অফিশিয়াল
            </span>
          </div>
        </aside>

        {/* Quick Links & WhatsApp Action */}
        <nav className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 text-xs font-semibold text-base-content/80">
          <Link href="/" className="hover:text-primary transition-colors">
            মার্কেটপ্লেস
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4 fill-emerald-600 shrink-0" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 2.015.82 2.796.821 3.183 0 5.769-2.587 5.77-5.767 0-3.18-2.587-5.806-5.77-5.806zm3.398 8.163c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.12-.516-1.594-.658-2.618-2.28-2.698-2.387-.079-.107-.648-.862-.648-1.644 0-.783.41-1.168.556-1.328.146-.16.32-.2.428-.2.107 0 .214.002.308.006.1.006.234-.038.366.28.134.318.456 1.11.496 1.19.04.08.067.173.013.28-.053.107-.08.173-.16.267-.079.093-.167.208-.239.28-.079.08-.162.167-.069.327.093.16.414.684.888 1.107.61.543 1.124.71 1.284.79.16.08.254.067.348-.04.093-.107.401-.467.508-.627.107-.16.214-.133.36-.08.147.053.935.44 1.095.52.16.08.267.12.307.187.04.067.04.387-.104.792z"/>
            </svg>
            হোয়াটসঅ্যাপ হেল্পডেস্ক
          </a>
          <a
            href={`mailto:${companyInfo.email || "support@kalobazar.shop"}`}
            className="hover:text-primary transition-colors"
          >
            ইমেইল সাপোর্ট
          </a>
        </nav>
      </div>
    </footer>
  );
}
