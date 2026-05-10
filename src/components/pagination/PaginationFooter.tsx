"use client";

import React from "react";
import { getPaginationPageNumbers } from "@/lib/pagination";

export type PaginationFooterProps = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  /** Preserves current URL query (filters, etc.). Overrides default `?page&limit` links. */
  hrefBuilder?: (targetPage: number) => string;
  /** `sm`: compact row (master-data style). */
  size?: "md" | "sm";
  summaryLocale?: "en" | "th";
  previousLabel?: string;
  nextLabel?: string;
  /** Inclusive 1-based range shown in the summary line. */
  summaryRange?: { from: number; to: number };
  maxButtons?: number;
  className?: string;
};

export default function PaginationFooter({
  page,
  limit,
  total,
  totalPages,
  hrefBuilder,
  size = "md",
  summaryLocale = "en",
  previousLabel,
  nextLabel,
  summaryRange,
  maxButtons = 5,
  className = "",
}: PaginationFooterProps) {
  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages));
  const link = (p: number) =>
    hrefBuilder ? hrefBuilder(p) : `?page=${p}&limit=${limit}`;

  const from =
    summaryRange?.from ?? (safePage - 1) * limit + 1;
  const to =
    summaryRange?.to ?? Math.min(safePage * limit, total);

  const prevText =
    previousLabel ?? (summaryLocale === "th" ? "ก่อนหน้า" : "Previous");
  const nextText =
    nextLabel ?? (summaryLocale === "th" ? "ถัดไป" : "Next");

  const summary =
    summaryLocale === "th"
      ? `แสดง ${from} ถึง ${to} จาก ${total} รายการ`
      : `Showing ${from} to ${to} of ${total} results`;

  const pageNums = getPaginationPageNumbers(safePage, totalPages, maxButtons);

  const isSm = size === "sm";
  const wrapCls = isSm
    ? "mt-4 flex flex-col gap-3 border-t border-gray-200 pt-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
    : "mt-6 flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between";
  const summaryCls = isSm
    ? "text-xs text-gray-500 dark:text-gray-400"
    : "text-sm text-gray-500 dark:text-gray-400";
  const navBtnCls = isSm
    ? "flex h-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
    : "mr-2.5 flex h-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]";
  const navBtnClsNext = isSm
    ? "ml-2 flex h-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
    : "ml-2.5 flex h-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]";
  const numGap = isSm ? "gap-1.5" : "gap-2";
  const numBtnCls = (active: boolean) =>
    isSm
      ? `flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium ${
          active
            ? "bg-brand-500 text-white"
            : "text-gray-700 hover:bg-blue-500/[0.08] hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
        }`
      : `flex h-10 w-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium ${
          active
            ? "bg-brand-500 text-white"
            : "text-gray-700 hover:bg-blue-500/[0.08] hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
        }`;

  return (
    <div className={`${wrapCls} ${className}`.trim()}>
      <div className={summaryCls}>{summary}</div>
      <div
        className={`flex flex-wrap items-center ${isSm ? "justify-between" : "justify-between"} gap-2 sm:justify-end`}
      >
        <a
          href={link(Math.max(1, safePage - 1))}
          className={`${navBtnCls} ${safePage <= 1 ? "pointer-events-none opacity-50" : ""}`}
        >
          {prevText}
        </a>
        <div className={`flex flex-wrap items-center justify-center ${numGap}`}>
          {pageNums.map((pageNum) => (
            <a
              key={pageNum}
              href={link(pageNum)}
              className={numBtnCls(safePage === pageNum)}
            >
              {pageNum}
            </a>
          ))}
        </div>
        <a
          href={link(Math.min(totalPages, safePage + 1))}
          className={`${navBtnClsNext} ${safePage >= totalPages ? "pointer-events-none opacity-50" : ""}`}
        >
          {nextText}
        </a>
      </div>
    </div>
  );
}
