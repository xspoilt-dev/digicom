import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const internalApi = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    return [
      {
        source: "/api/:path*",
        destination: `${internalApi}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${internalApi}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
