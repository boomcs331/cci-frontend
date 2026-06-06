"use client";

import React from "react";
import { LoadingState } from "@/components/shared";
import type { PcTransactionVariant } from "./theme";
import { TRANSACTION_THEME } from "./theme";

export function PcTransactionLoading({
  pageTitle,
  variant,
}: {
  pageTitle: string;
  variant: PcTransactionVariant;
}) {
  const theme = TRANSACTION_THEME[variant];

  return (
    <div className="mx-auto max-w-[1600px] animate-pulse space-y-6 px-3 pb-8 sm:px-4 lg:px-6">
      <div className={`h-36 rounded-2xl bg-gradient-to-br ${theme.gradient} opacity-60`} />
      <div className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-800" />
      <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}
