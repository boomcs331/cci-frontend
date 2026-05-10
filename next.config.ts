import type { NextConfig } from "next";

/**
 * Backend ภายในเครื่อง — ใช้สำหรับ proxy ผ่าน Next.js rewrites
 * เปลี่ยนผ่าน env BACKEND_INTERNAL_URL ได้ (เช่นเมื่อรันใน Docker network)
 */
const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:3006";

const nextConfig: NextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  /**
   * Reverse-proxy ผ่าน Next.js เพื่อให้ใช้ tunnel เดียวกับ frontend ได้
   * (เหมาะกับ Cloudflare Quick Tunnel / TryCloudflare ที่ไม่มี domain)
   * Browser เรียก /api/... → Next.js → backend localhost:3006
   * - same-origin จึงไม่มี CORS
   * - /uploads ก็ proxy ด้วย เพื่อให้รูปภาพ/ไฟล์ที่ backend serve เปิดได้
   */
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_INTERNAL_URL}/:path*` },
      { source: "/uploads/:path*", destination: `${BACKEND_INTERNAL_URL}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
