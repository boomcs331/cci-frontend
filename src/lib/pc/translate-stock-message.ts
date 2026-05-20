/** แปลข้อความสต็อกไม่พอจาก API รุ่นเก่า (ภาษาอังกฤษ) เป็นภาษาไทย */
export function translateInsufficientStockMessage(message: string): string | undefined {
  const trimmed = message.trim();
  if (!trimmed || /[\u0E00-\u0E7F]/.test(trimmed)) {
    return undefined;
  }

  const fmt = (n: string) => {
    const num = Number(n);
    return Number.isFinite(num) ? num.toLocaleString('th-TH') : n;
  };

  const withMat =
    /^Insufficient stock for material ([^.]+)\.\s*Available:\s*([\d.]+),\s*(?:Requested|Required):\s*([\d.]+)$/i.exec(
      trimmed,
    );
  if (withMat) {
    return `สต็อกวัตถุดิบ ${withMat[1].trim()} ไม่เพียงพอ (คงเหลือ ${fmt(withMat[2])}, ต้องการ ${fmt(withMat[3])})`;
  }

  const plain =
    /^Insufficient stock\.\s*Available:\s*([\d.]+),\s*Requested:\s*([\d.]+)$/i.exec(trimmed);
  if (plain) {
    return `สต็อกวัตถุดิบไม่เพียงพอ (คงเหลือ ${fmt(plain[1])}, ต้องการ ${fmt(plain[2])})`;
  }

  const short = /^Insufficient stock for material ([^.]+)$/i.exec(trimmed);
  if (short) {
    return `สต็อกวัตถุดิบ ${short[1].trim()} ไม่เพียงพอ`;
  }

  return undefined;
}
