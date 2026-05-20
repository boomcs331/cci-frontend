import React from "react";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:
    "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800/50",
  USED_UP:
    "bg-gray-100 text-gray-700 ring-1 ring-gray-200/80 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700/50",
  PARTIAL_USED:
    "bg-amber-100 text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/50",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "ใช้งานได้",
  USED_UP: "ใช้หมดแล้ว",
  PARTIAL_USED: "ใช้บางส่วน",
};

type PcStatusBadgeProps = {
  status: string;
  className?: string;
};

export function PcStatusBadge({ status, className = "" }: PcStatusBadgeProps) {
  const key = (status || "").toUpperCase();
  const style = STATUS_STYLES[key] ?? STATUS_STYLES.USED_UP;
  const label = STATUS_LABELS[key] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style} ${className}`}
    >
      {label}
    </span>
  );
}
