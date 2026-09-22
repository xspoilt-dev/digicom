/**
 * Centralized API & Asset URL resolver with bulletproof production fallback.
 * Prevents clients on public domains from ever querying localhost:5000.
 */
export const getApiUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  // Browser execution
  if (typeof window !== "undefined") {
    const isLocalhostHost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl.replace(/\/$/, "");
    }

    // In production on a real domain (e.g. kalobazar.shop):
    // Always use relative URL "" so requests route to current domain (/api/*, /uploads/*)
    if (!isLocalhostHost) {
      return "";
    }

    return envUrl ? envUrl.replace(/\/$/, "") : "http://localhost:5000";
  }

  // Server-side runtime (SSR / Middleware)
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL.replace(/\/$/, "");
  }

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  return "http://localhost:5000";
};

export const API_URL = getApiUrl();
