"use client";

import React from "react";
import Link from "next/link";

export type OverviewHubAccent =
  | "brand"
  | "blueLight"
  | "success"
  | "orange"
  | "warning"
  | "purple";

export type OverviewHubItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
  description?: string;
  /** ถ้าไม่ระบุ จะสลับสีตามลำดับการ์ด */
  accent?: OverviewHubAccent;
};

type OverviewHubSectionProps = {
  title: string;
  sectionDescription: string;
  icon?: React.ReactNode;
  items: OverviewHubItem[];
};

const ACCENT_STYLES: Record<
  OverviewHubAccent,
  {
    card: string;
    border: string;
    borderHover: string;
    shadow: string;
    iconWrap: string;
    titleHover: string;
  }
> = {
  brand: {
    card:
      "bg-gradient-to-br from-brand-50/95 to-white dark:from-brand-950/35 dark:to-gray-900",
    border: "border-brand-200/70 dark:border-brand-800/45",
    borderHover: "hover:border-brand-400 dark:hover:border-brand-500",
    shadow: "hover:shadow-lg hover:shadow-brand-500/15",
    iconWrap:
      "bg-brand-100 text-brand-600 shadow-inner shadow-brand-500/10 dark:bg-brand-500/20 dark:text-brand-300",
    titleHover: "group-hover:text-brand-600 dark:group-hover:text-brand-300",
  },
  blueLight: {
    card:
      "bg-gradient-to-br from-blue-light-50/95 to-white dark:from-blue-light-950/25 dark:to-gray-900",
    border: "border-blue-light-200/70 dark:border-blue-light-800/40",
    borderHover: "hover:border-blue-light-400 dark:hover:border-blue-light-500",
    shadow: "hover:shadow-lg hover:shadow-blue-light-500/15",
    iconWrap:
      "bg-blue-light-100 text-blue-light-600 shadow-inner shadow-blue-light-500/10 dark:bg-blue-light-500/15 dark:text-blue-light-300",
    titleHover:
      "group-hover:text-blue-light-700 dark:group-hover:text-blue-light-300",
  },
  success: {
    card:
      "bg-gradient-to-br from-success-50/95 to-white dark:from-success-950/30 dark:to-gray-900",
    border: "border-success-200/70 dark:border-success-800/40",
    borderHover: "hover:border-success-400 dark:hover:border-success-500",
    shadow: "hover:shadow-lg hover:shadow-success-500/12",
    iconWrap:
      "bg-success-100 text-success-600 shadow-inner shadow-success-500/10 dark:bg-success-500/15 dark:text-success-300",
    titleHover:
      "group-hover:text-success-700 dark:group-hover:text-success-300",
  },
  orange: {
    card:
      "bg-gradient-to-br from-orange-50/95 to-white dark:from-orange-950/25 dark:to-gray-900",
    border: "border-orange-200/70 dark:border-orange-800/40",
    borderHover: "hover:border-orange-400 dark:hover:border-orange-500",
    shadow: "hover:shadow-lg hover:shadow-orange-500/12",
    iconWrap:
      "bg-orange-100 text-orange-600 shadow-inner shadow-orange-500/10 dark:bg-orange-500/15 dark:text-orange-300",
    titleHover: "group-hover:text-orange-700 dark:group-hover:text-orange-300",
  },
  warning: {
    card:
      "bg-gradient-to-br from-warning-50/95 to-white dark:from-warning-950/25 dark:to-gray-900",
    border: "border-warning-200/70 dark:border-warning-800/40",
    borderHover: "hover:border-warning-400 dark:hover:border-warning-500",
    shadow: "hover:shadow-lg hover:shadow-warning-500/12",
    iconWrap:
      "bg-warning-100 text-warning-700 shadow-inner shadow-warning-500/10 dark:bg-warning-500/15 dark:text-warning-300",
    titleHover: "group-hover:text-warning-800 dark:group-hover:text-warning-300",
  },
  purple: {
    card:
      "bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-900",
    border: "border-theme-purple-500/25 dark:border-theme-purple-500/35",
    borderHover: "hover:border-theme-purple-500/55 dark:hover:border-theme-purple-500/60",
    shadow: "hover:shadow-lg hover:shadow-theme-purple-500/15",
    iconWrap:
      "bg-theme-purple-500/15 text-theme-purple-500 shadow-inner dark:bg-theme-purple-500/20 dark:text-theme-purple-400",
    titleHover:
      "group-hover:text-theme-purple-600 dark:group-hover:text-theme-purple-400",
  },
};

const ACCENT_CYCLE: OverviewHubAccent[] = [
  "brand",
  "blueLight",
  "success",
  "orange",
  "warning",
  "purple",
];

/**
 * การ์ดลิงก์แบบเดียวกับหน้า /master-data (Section + grid)
 */
export function OverviewHubSection({
  title,
  sectionDescription,
  icon,
  items,
}: OverviewHubSectionProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-gradient-to-br from-white via-gray-50/40 to-brand-25/40 shadow-sm dark:border-gray-700/90 dark:from-gray-800 dark:via-gray-800 dark:to-brand-950/25">
      <div
        className="h-1.5 w-full bg-gradient-to-r from-brand-500 via-theme-purple-500 to-blue-light-500"
        aria-hidden
      />
      <div className="p-6">
        <div className="mb-1 flex items-start gap-3">
          {icon ? (
            <span
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-lg text-brand-600 shadow-sm dark:from-brand-500/25 dark:to-brand-950/40 dark:text-brand-400"
              aria-hidden="true"
            >
              {icon}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {sectionDescription}
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const accentKey =
              item.accent ?? ACCENT_CYCLE[index % ACCENT_CYCLE.length];
            const a = ACCENT_STYLES[accentKey];
            return (
              <Link
                key={item.path + item.name}
                href={item.path}
                className={`group relative overflow-hidden rounded-xl border p-6 transition-all duration-200 ${a.card} ${a.border} ${a.borderHover} ${a.shadow} hover:-translate-y-0.5`}
              >
                <div
                  className={`mb-4 inline-flex rounded-2xl p-3 text-2xl leading-none ${a.iconWrap}`}
                >
                  {item.icon}
                </div>
                <h3
                  className={`text-lg font-medium text-gray-900 transition-colors dark:text-white ${a.titleHover}`}
                >
                  {item.name}
                </h3>
                {item.description ? (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
