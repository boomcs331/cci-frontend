"use client";

import React from "react";
import { PageHeader } from "@/components/shared";
import { TRANSACTION_THEME, type PcTransactionVariant } from "./theme";

export type PcTransactionStat = {
  label: string;
  value: React.ReactNode;
};

type PcTransactionPageHeaderProps = {
  variant: PcTransactionVariant;
  pageTitle: string;
  description: string;
  icon: React.ReactNode;
  stats?: PcTransactionStat[];
  actions?: React.ReactNode;
};

export function PcTransactionPageHeader({
  variant,
  pageTitle,
  description,
  icon,
  stats = [],
  actions,
}: PcTransactionPageHeaderProps) {
  const theme = TRANSACTION_THEME[variant];

  return (
    <div className="space-y-4">
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} p-5 shadow-lg ring-1 ${theme.ring} sm:p-6 lg:p-8`}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-black/10 blur-2xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${theme.iconBg}`}
              aria-hidden
            >
              {icon}
            </div>
            <div className="min-w-0">
              <h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${theme.iconText}`}>
                {pageTitle}
              </h1>
              <p className={`mt-1 max-w-2xl text-sm leading-relaxed ${theme.accentText}`}>
                {description}
              </p>
              {stats.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {stats.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl border border-white/20 bg-black/10 px-3 py-2 backdrop-blur-sm"
                    >
                      <p className={`text-[10px] font-medium uppercase tracking-wider ${theme.statLabel}`}>
                        {s.label}
                      </p>
                      <p className="text-lg font-semibold tabular-nums text-white">{s.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {actions ? (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
