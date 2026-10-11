import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  serverExternalPackages: ["@node-rs/argon2", "sharp", "exceljs"],
};

export default nextConfig;
