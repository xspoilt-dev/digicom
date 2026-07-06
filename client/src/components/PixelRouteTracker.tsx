"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function RouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const w = window as any;
    if (typeof w.fbq === "function") {
      w.fbq("track", "PageView");
      console.log(`[Meta Pixel] PageView tracked dynamically for ${pathname}`);
    }
  }, [pathname, searchParams]);

  return null;
}

export function PixelRouteTracker() {
  return (
    <Suspense fallback={null}>
      <RouteTracker />
    </Suspense>
  );
}
