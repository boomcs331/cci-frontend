"use client";

import React from "react";
import { TRANSACTION_THEME, type PcTransactionVariant } from "./theme";

type PcTransactionActionButtonProps = {
  variant: PcTransactionVariant;
  tone?: "primary" | "secondary";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function PcTransactionActionButton({
  variant,
  tone = "primary",
  onClick,
  type = "button",
  disabled,
  children,
  className = "",
}: PcTransactionActionButtonProps) {
  const theme = TRANSACTION_THEME[variant];
  const base =
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all sm:w-auto disabled:cursor-not-allowed disabled:opacity-60";
  const toneCls =
    tone === "primary"
      ? theme.primaryBtn
      : theme.secondaryBtn;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${toneCls} ${className}`}
    >
      {children}
    </button>
  );
}
