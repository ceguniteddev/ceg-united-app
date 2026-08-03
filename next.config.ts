import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  generateEtags: false,
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  poweredByHeader: false,
  allowedDevOrigins: ["raccoon-robust-likely.ngrok-free.app"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  headers: async () => {
    return [
      {
        source: "/.well-known/apple-developer-merchantid-domain-association",
        headers: [
          {
            key: "content-type",
            value: "application/json", // Set the correct content type
          },
        ],
      },
      {
        // Security: Apply security headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=(), payment=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://cdn.tiny.cloud https://cdn.tailwindcss.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tiny.cloud",
              "img-src 'self' data: blob: https://storage.googleapis.com https://placehold.co https://tradelinesupply.com",
              "font-src 'self' data: https://fonts.gstatic.com https://cdn.tiny.cloud",
              "connect-src 'self' https://storage.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://*.cloudfunctions.net https://api.mux.com https://stream.mux.com https://recaptchaenterprise.googleapis.com https://www.google.com",
              "media-src 'self' blob: https://storage.googleapis.com https://stream.mux.com",
              "frame-src 'self' blob: https://www.google.com https://recaptcha.google.com https://storage.googleapis.com https://whop.com https://calendly.com https://lob-assets.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "tradelinesupply.com",
      },
    ],
  },
};

export default nextConfig;
