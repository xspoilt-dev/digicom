// lib/meta/track-event.ts
import { getFbCookies } from "./cookies";
import { getApiUrl } from "@/lib/api";

function generateEventId(): string {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface TrackEventOptions {
  eventId?: string;
  email?: string;
  phone?: string;
  skipCapi?: boolean;
}

/**
 * High-performance Dual-Dispatch Meta Pixel + Conversions API (CAPI) tracking helper.
 * Fires both browser pixel and server CAPI with the exact same eventID for automatic Meta deduplication.
 */
export function trackEvent(
  eventName: string,
  params: Record<string, unknown> = {},
  options?: TrackEventOptions
): string {
  const eventId = options?.eventId || generateEventId();
  const cookies = getFbCookies();

  if (typeof window !== "undefined") {
    // 1. Browser Client-Side Meta Pixel (fbevents.js)
    const w = window as any;
    if (typeof w.fbq === "function") {
      w.fbq("track", eventName, params, { eventID: eventId });
      console.log(`[Meta Dual-Track] Pixel dispatched: "${eventName}"`, {
        eventID: eventId,
        params,
      });
    } else {
      console.debug(`[Meta Dual-Track] fbq not ready yet for "${eventName}", queued for CAPI`);
    }

    // 2. Server-Side Conversions API (CAPI) Dual-Dispatch Relay
    if (!options?.skipCapi) {
      const apiUrl = getApiUrl();
      fetch(`${apiUrl}/api/meta-capi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName,
          eventId,
          params,
          fbp: cookies.fbp,
          fbc: cookies.fbc,
          email: options?.email,
          phone: options?.phone,
          eventSourceUrl: window.location.href,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log(`[Meta Dual-Track] CAPI delivered: "${eventName}" (ID: ${eventId})`);
          } else {
            console.warn(`[Meta Dual-Track] CAPI warning for "${eventName}":`, data);
          }
        })
        .catch((err) => {
          console.debug("[Meta Dual-Track] CAPI network relay error:", err);
        });
    }
  }

  return eventId;
}
