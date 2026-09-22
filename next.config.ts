import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Groq is only ever called from server-side Route Handlers (see src/app/api/ai/*).
  // No server secrets are exposed through NEXT_PUBLIC_* variables.
};

export default nextConfig;
