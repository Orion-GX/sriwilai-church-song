/** @type {import('next').NextConfig} */
const backendInternal =
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ?? "";

const publicApiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (backendInternal ? "/api/v1" : "http://localhost:3001/api/v1");

/** ถ้า API เป็น path แบบ /api/v1 ให้เว้น WS ว่างเพื่อให้ client ใช้ origin เดียวกับหน้าเว็บ (Nginx) */
const publicWsOrigin =
  process.env.NEXT_PUBLIC_WS_ORIGIN !== undefined
    ? process.env.NEXT_PUBLIC_WS_ORIGIN
    : String(publicApiUrl).startsWith("/")
      ? ""
      : backendInternal || "http://localhost:3001";

const nextConfig = {
  output: "standalone",

  async redirects() {
    return [
      { source: "/homepage", destination: "/", permanent: true },
    ];
  },

  /** reverse proxy (dev): ตั้ง BACKEND_INTERNAL_URL ไป Nest */
  async rewrites() {
    if (!backendInternal) {
      return [];
    }
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendInternal}/api/v1/:path*`,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: publicApiUrl,
    NEXT_PUBLIC_WS_ORIGIN: publicWsOrigin,
  },
};

export default nextConfig;
