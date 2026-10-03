import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns-jalali", "framer-motion"],
  },
  serverExternalPackages: ["@node-rs/argon2"],
};

export default nextConfig;
