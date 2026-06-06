import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@jsontools/shared"],
  async rewrites() {
    // API_URL is a server-side env var used only for the rewrite proxy.
    // Falls back to localhost:4000 for local dev.
    const apiUrl = process.env.API_URL ?? "http://localhost:4000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
