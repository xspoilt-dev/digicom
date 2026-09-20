"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ShopRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams?.toString();
    router.replace(params ? `/?${params}` : "/");
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="flex flex-col items-center gap-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <span className="text-xs font-bold text-base-content/60">KaloBazar স্টোরে রিডাইরেক্ট করা হচ্ছে...</span>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }
    >
      <ShopRedirectContent />
    </Suspense>
  );
}
