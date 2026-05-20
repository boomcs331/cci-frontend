"use client";

import React from "react";
import type { PcTransactionVariant } from "./theme";

type PcTransactionDataCardProps = {
  variant: PcTransactionVariant;
  title: string;
  description?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function PcTransactionDataCard({
  variant,
  title,
  description,
  toolbar,
  children,
  footer,
}: PcTransactionDataCardProps) {
  const accentBar =
    variant === "income"
      ? "from-success-500 to-emerald-400"
      : "from-orange-500 to-amber-400";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/90">
      <div className={`h-1 bg-gradient-to-r ${accentBar}`} aria-hidden />
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              {description}
            </p>
          ) : null}
        </div>
        {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
      </div>
      <div className="bg-white dark:bg-gray-900/40">{children}</div>
      {footer ? (
        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700 sm:px-5">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
