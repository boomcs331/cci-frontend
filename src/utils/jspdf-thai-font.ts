import type jsPDF from "jspdf";

const FONT_REGULAR_FILE = "Sarabun-Regular.ttf";
const FONT_BOLD_FILE = "Sarabun-Bold.ttf";

/** ชื่อฟอนต์สำหรับ setFont / jspdf-autotable styles.font */
export const THAI_PDF_FONT = "Sarabun";

let cachedRegularB64: string | null = null;
let cachedBoldB64: string | null = null;
let loadPromise: Promise<void> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

async function fetchFontBase64(relativePath: string): Promise<string> {
  const base =
    typeof window !== "undefined" ? window.location.origin : "";
  const url = `${base}${relativePath}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`โหลดฟอนต์ไม่สำเร็จ: ${relativePath} (${res.status})`);
  }
  return arrayBufferToBase64(await res.arrayBuffer());
}

/**
 * โหลด Sarabun จาก /public/fonts (เรียกครั้งเดียวแล้วแคช base64)
 */
export function ensureThaiPdfFontsLoaded(): Promise<void> {
  if (cachedRegularB64 && cachedBoldB64) {
    return Promise.resolve();
  }
  if (!loadPromise) {
    loadPromise = (async () => {
      const [r, b] = await Promise.all([
        fetchFontBase64(`/fonts/${FONT_REGULAR_FILE}`),
        fetchFontBase64(`/fonts/${FONT_BOLD_FILE}`),
      ]);
      cachedRegularB64 = r;
      cachedBoldB64 = b;
    })();
  }
  return loadPromise;
}

/**
 * ผูกฟอนต์ไทยกับ instance jsPDF (ต้องเรียกหลัง new jsPDF ทุกครั้ง)
 */
export function registerThaiFontOnDoc(doc: jsPDF): void {
  if (!cachedRegularB64 || !cachedBoldB64) {
    throw new Error("เรียก ensureThaiPdfFontsLoaded() ก่อน registerThaiFontOnDoc");
  }
  doc.addFileToVFS(FONT_REGULAR_FILE, cachedRegularB64);
  doc.addFont(FONT_REGULAR_FILE, THAI_PDF_FONT, "normal");
  doc.addFileToVFS(FONT_BOLD_FILE, cachedBoldB64);
  doc.addFont(FONT_BOLD_FILE, THAI_PDF_FONT, "bold");
}
