import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
// ارتقای اجباری به HTTPS فقط وقتی سایت واقعاً روی HTTPS است (نه تست محلی)
const isHttps = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");

/**
 * سیاست امنیت محتوا. اسکریپت‌های inline (JSON-LD، اسکریپت تم و Next) بدون nonce مجازند تا
 * صفحات استاتیک/ISR حفظ شوند؛ در عوض منبع اسکریپت‌ها به خود سایت و Google Analytics محدود است.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com",
  "frame-src https://www.aparat.com https://www.youtube-nocookie.com https://www.youtube.com",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://payment.zarinpal.com https://sandbox.zarinpal.com",
  "frame-ancestors 'none'",
  ...(isProd && isHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isProd && isHttps ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // فونت‌ها و فایل‌های استاتیک نسخه‌دار: کش طولانی
      { source: "/_next/static/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
  output: "standalone",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // آپلود فایل‌های نصب نسخه‌ها و رسانه از طریق Server Action
    serverActions: { bodySizeLimit: "300mb" },
    optimizePackageImports: ["lucide-react", "date-fns-jalali", "framer-motion"],
  },
  // فونت TTF تصاویر OG (Satori از woff2 پشتیبانی نمی‌کند) باید در خروجی standalone کپی شود
  outputFileTracingIncludes: { "/**": ["./src/fonts/og/*.ttf"] },
  serverExternalPackages: ["@node-rs/argon2", "sharp", "exceljs"],
};

export default nextConfig;
