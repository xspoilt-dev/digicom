// lib/meta/cookies.ts
export function getFbCookies() {
  if (typeof document === "undefined") return { fbp: undefined, fbc: undefined };
  const get = (name: string) =>
    document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];
  return { fbp: get("_fbp"), fbc: get("_fbc") };
}
