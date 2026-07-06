// lib/meta/track-event.ts
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

export function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  const eventId = generateUUID();

  if (typeof window !== "undefined") {
    const w = window as any;
    if (typeof w.fbq === "function") {
      w.fbq("track", eventName, params, { eventID: eventId });
      console.log(`[Meta Pixel] Client tracked: ${eventName}`, params, { eventID: eventId });
    } else {
      console.warn("[Meta Pixel] fbq not loaded client-side yet");
    }
  }

  return eventId;
}
