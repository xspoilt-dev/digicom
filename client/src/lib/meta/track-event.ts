// lib/meta/track-event.ts
import { getFbCookies } from "./cookies";

function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface TrackEventOptions {
  eventId?: string;
  email?: string;
  phone?: string;
  skipCapi?: boolean;
}

/**
 * Dual-dispatch Meta Pixel + Conversions API (CAPI) tracking helper.
 * Fires both browser pixel and server CAPI with identical eventID for automated Meta deduplication.
 */
export function trackEvent(
  eventName: string,
  params: Record<string, unknown> = {},
  options?: TrackEventOptions
): string {
  const eventId = options?.eventId || generateUUID();
  const cookies = getFbCookies();

  // 1. Browser Client-Side Meta Pixel (fbevents.js)
  if (typeof window !== "undefined") {
    const w = window as any;
    if (typeof w.fbq === "function") {
      w.fbq("track", eventName, params, { eventID: eventId });
      console.log(`[Meta Pixel & CAPI Dual-Track] Browser fired: ${eventName}`, {
        eventID: eventId,
        params,
      });
    } else {
      console.warn("[Meta Pixel] fbq not initialized yet");
    }

    // 2. Server-Side Conversions API (CAPI) Dual-Dispatch Relay
    if (!options?.skipCapi) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
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
      }).catch((err) => {
        console.warn("[Meta CAPI Relay] Failed to dispatch CAPI event:", err);
      });
    }
  }

  return eventId;
}
