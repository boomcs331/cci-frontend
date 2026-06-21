export type PcTransactionVariant = "income" | "outcome" | "production";

export const TRANSACTION_THEME: Record<
  PcTransactionVariant,
  {
    gradient: string;
    iconBg: string;
    iconText: string;
    ring: string;
    primaryBtn: string;
    secondaryBtn: string;
    accentText: string;
    tableHeader: string;
    statLabel: string;
  }
> = {
  income: {
    gradient:
      "from-success-600/90 via-emerald-600/85 to-teal-700/90 dark:from-success-800/80 dark:via-emerald-900/75 dark:to-teal-950/85",
    iconBg: "bg-white/20 text-white backdrop-blur-sm",
    iconText: "text-white",
    ring: "ring-success-500/25",
    primaryBtn:
      "bg-white text-success-800 shadow-lg shadow-black/10 hover:bg-success-50 dark:bg-white dark:text-success-900 dark:hover:bg-success-50",
    secondaryBtn:
      "border border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20",
    accentText: "text-success-100",
    tableHeader: "bg-success-50/80 dark:bg-success-950/30",
    statLabel: "text-success-100/90",
  },
  outcome: {
    gradient:
      "from-orange-600/90 via-amber-600/85 to-orange-700/90 dark:from-orange-900/80 dark:via-amber-950/75 dark:to-orange-950/85",
    iconBg: "bg-white/20 text-white backdrop-blur-sm",
    iconText: "text-white",
    ring: "ring-orange-500/25",
    primaryBtn:
      "bg-white text-orange-800 shadow-lg shadow-black/10 hover:bg-orange-50 dark:bg-white dark:text-orange-900 dark:hover:bg-orange-50",
    secondaryBtn:
      "border border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20",
    accentText: "text-orange-100",
    tableHeader: "bg-orange-50/80 dark:bg-orange-950/25",
    statLabel: "text-orange-100/90",
  },
  production: {
    gradient: "bg-orange-600 dark:bg-orange-800",
    iconBg: "bg-white/20 text-white backdrop-blur-sm",
    iconText: "text-white",
    ring: "ring-orange-500/25",
    primaryBtn:
      "bg-white text-orange-800 shadow-lg shadow-black/10 hover:bg-orange-50 dark:bg-white dark:text-orange-900 dark:hover:bg-orange-50",
    secondaryBtn:
      "border border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20",
    accentText: "text-orange-100",
    tableHeader: "bg-orange-50/80 dark:bg-orange-950/30",
    statLabel: "text-orange-100/90",
  },
};
