"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { trackEvent } from "@/lib/meta/track-event";

function RouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Avoid double-firing on initial page load if already handled, or let trackEvent dual-dispatch
    trackEvent("PageView", {
      path: pathname,
      search: searchParams?.toString() || "",
    });
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
