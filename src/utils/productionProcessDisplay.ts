/** ชื่อขั้นที่แสดงใน UI — WELDING → Welding, PRESS → Press */
export function processStepDisplayName(
  code?: string | null,
  name?: string | null,
): string {
  const upper = (code ?? "").trim().toUpperCase();
  if (upper === "WELDING") return "Welding";
  if (upper === "PRESS") return "Press";
  if (upper === "CHECKING") return "Checking";
  if (upper === "COMPLETE") return "Complete";
  const n = name?.trim();
  if (n) return n;
  if (code?.trim()) return code.trim();
  return "—";
}

export function processStepBadgeClass(
  code?: string | null,
  inProgress = false,
): string {
  const upper = (code ?? "").trim().toUpperCase();
  const base = "ring-1 ring-inset";
  if (upper === "WELDING") {
    return inProgress
      ? `${base} bg-orange-100 text-orange-900 ring-orange-500/40 dark:bg-orange-950/60 dark:text-orange-100`
      : `${base} bg-orange-50 text-orange-800 ring-orange-300/50 dark:bg-orange-950/30 dark:text-orange-200`;
  }
  if (upper === "PRESS") {
    return inProgress
      ? `${base} bg-violet-100 text-violet-900 ring-violet-500/40 dark:bg-violet-950/60 dark:text-violet-100`
      : `${base} bg-violet-50 text-violet-800 ring-violet-300/50 dark:bg-violet-950/30 dark:text-violet-200`;
  }
  return inProgress
    ? `${base} bg-blue-100 text-blue-900 ring-blue-500/40 dark:bg-blue-950/60 dark:text-blue-100`
    : `${base} bg-gray-100 text-gray-800 ring-gray-300/50 dark:bg-gray-800 dark:text-gray-200`;
}
