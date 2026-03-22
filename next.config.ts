import type { NextConfig } from "next";

const securityHeaders = [
  // Content Security Policy — restricts resource loading to trusted origins
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://app.posthog.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.googleusercontent.com https://avatars.githubusercontent.com",
      "font-src 'self'",
      "connect-src 'self' https://app.posthog.com https://us.i.posthog.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer information sent cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict unnecessary browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Force HTTPS for 2 years (browsers will reject HTTP after first visit)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Enable DNS prefetch for performance
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
