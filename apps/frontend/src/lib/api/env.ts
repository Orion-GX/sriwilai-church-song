/**
 * ต้นทาง REST เช่น http://localhost:3001/api/v1 หรือ /api/v1 (ไม่มีท้าย slash)
 * ถ้าขึ้นต้นด้วย `/` จะต่อกับ origin ของหน้าเว็บ (เหมาะกับ Next.js rewrites)
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  if (!raw) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/v1`;
    }
    return "http://localhost:3001/api/v1";
  }
  if (raw.startsWith("/")) {
    const path = raw.replace(/\/$/, "");
    if (typeof window !== "undefined") {
      return `${window.location.origin.replace(/\/$/, "")}${path}`;
    }
    return `http://localhost:3000${path}`;
  }
  return raw.replace(/\/$/, "");
}

/** origin สำหรับ Socket.IO — ถ้าไม่ตั้งจะดึงจาก NEXT_PUBLIC_API_URL หรือ origin ปัจจุบันเมื่อใช้ path relative */
export function getWsOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_ORIGIN?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const api = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  if (api.startsWith("/")) {
    if (typeof window !== "undefined") {
      return window.location.origin.replace(/\/$/, "");
    }
    return "http://localhost:3000";
  }
  try {
    const u = new URL(getApiBase());
    return u.origin;
  } catch {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
}
