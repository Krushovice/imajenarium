import type { NextConfig } from "next";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://backend:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Sentry tree-shaking in prod
    optimizePackageImports: ["@sentry/nextjs"],
  },
  // In dev: Next.js proxies /api/* to the backend container so SSR works
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    return [
      {
        source: "/api/:path*",
        destination: `${INTERNAL_API_URL}/api/:path*`,
      },
    ];
  },
};

// Wrap with Sentry only when DSN is provided (skips in CI without secrets)
async function buildConfig(): Promise<NextConfig> {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return nextConfig;
  }
  const { withSentryConfig } = await import("@sentry/nextjs");
  return withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    disableLogger: true,
  });
}

export default buildConfig();
