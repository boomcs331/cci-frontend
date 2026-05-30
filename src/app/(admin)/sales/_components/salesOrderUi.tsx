import type { SalesOrderStatus } from "@/services/sales/salesOrderService";

export const STATUS_OPTIONS: { value: SalesOrderStatus; label: string }[] = [
  { value: "DRAFT", label: "ร่าง" },
  { value: "PENDING", label: "รออนุมัติ" },
  { value: "APPROVED", label: "อนุมัติแล้ว" },
  { value: "PROCESSING", label: "กำลังจัด" },
  { value: "SHIPPING", label: "กำลังจัดส่ง" },
  { value: "COMPLETED", label: "สำเร็จ" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

export function statusBadge(status: SalesOrderStatus): {
  label: string;
  className: string;
} {
  const map: Record<SalesOrderStatus, { label: string; className: string }> = {
    DRAFT: {
      label: "ร่าง",
      className:
        "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-500/15 dark:bg-gray-500/15 dark:text-gray-300",
    },
    PENDING: {
      label: "รออนุมัติ",
      className:
        "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-600/15 dark:bg-amber-500/15 dark:text-amber-300",
    },
    APPROVED: {
      label: "อนุมัติแล้ว",
      className:
        "bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-600/15 dark:bg-blue-500/15 dark:text-blue-300",
    },
    PROCESSING: {
      label: "กำลังจัด",
      className:
        "bg-indigo-100 text-indigo-800 ring-1 ring-inset ring-indigo-600/15 dark:bg-indigo-500/15 dark:text-indigo-300",
    },
    SHIPPING: {
      label: "กำลังจัดส่ง",
      className:
        "bg-cyan-100 text-cyan-800 ring-1 ring-inset ring-cyan-600/15 dark:bg-cyan-500/15 dark:text-cyan-300",
    },
    COMPLETED: {
      label: "สำเร็จ",
      className:
        "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-600/15 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    CANCELLED: {
      label: "ยกเลิก",
      className:
        "bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-600/15 dark:bg-rose-500/15 dark:text-rose-300",
    },
  };
  return map[status];
}

export const baht = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
});

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("th-TH");
}
