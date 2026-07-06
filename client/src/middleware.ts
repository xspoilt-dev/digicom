import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, api routes, admin endpoints, and common files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/admin") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  try {
    const res = await fetch(`${apiUrl}/api/resolve-route?path=${encodeURIComponent(pathname)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.resolved) {
        const dest = data.destinationPath;
        if (data.redirectType === "redirect") {
          return NextResponse.redirect(new URL(dest, request.url), 302);
        } else {
          // Internal rewrite so the user stays on the custom path
          return NextResponse.rewrite(new URL(dest, request.url));
        }
      }
    }
  } catch (error) {
    console.error("Dynamic route resolver middleware error:", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
