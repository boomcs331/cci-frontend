import { publishToast } from "@/context/ToastContext";
import { PERMISSION_LABELS_TH } from "@/utils/permissionLabels";

export function extractApiErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.message === "string") return record.message;
  if (Array.isArray(record.message)) {
    return record.message.map(String).join(", ");
  }
  if (typeof record.error === "string") return record.error;
  return null;
}

/** แปลข้อความ error จาก API (เช่น Missing permission) เป็นภาษาไทย */
export function translateApiErrorMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "เกิดข้อผิดพลาด";

  const missing = /^Missing permission:\s*(.+)$/i.exec(trimmed);
  if (missing) {
    const code = missing[1].trim();
    const label = PERMISSION_LABELS_TH[code] ?? code;
    return `ไม่มีสิทธิ์ "${label}" (${code}) — ติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์`;
  }

  if (/^Insufficient permissions$/i.test(trimmed)) {
    return "สิทธิ์ไม่เพียงพอสำหรับการดำเนินการนี้";
  }

  if (/your department is not allowed/i.test(trimmed)) {
    return "แผนกที่เลือกไม่มีสิทธิ์ดำเนินการขั้นตอนนี้";
  }

  if (/Forbidden/i.test(trimmed)) {
    return "ไม่มีสิทธิ์ดำเนินการนี้";
  }

  return trimmed;
}

let lastForbiddenToastAt = 0;
let lastForbiddenToastKey = "";

/** แสดง popup เมื่อ API ตอบ 403 */
export function notifyForbiddenApiError(body: unknown): void {
  const raw = extractApiErrorMessage(body) ?? "ไม่มีสิทธิ์ดำเนินการนี้";
  const message = translateApiErrorMessage(raw);
  const key = message.slice(0, 120);
  const now = Date.now();
  if (key === lastForbiddenToastKey && now - lastForbiddenToastAt < 1500) {
    return;
  }
  lastForbiddenToastKey = key;
  lastForbiddenToastAt = now;

  publishToast({
    variant: "error",
    title: "ไม่มีสิทธิ์",
    message,
    durationMs: 7000,
  });
}

export async function parseApiErrorResponse(
  res: Response,
  fallback: string,
): Promise<string> {
  const body = await res.json().catch(() => ({}));
  const raw = extractApiErrorMessage(body) ?? fallback;
  return translateApiErrorMessage(raw);
}
