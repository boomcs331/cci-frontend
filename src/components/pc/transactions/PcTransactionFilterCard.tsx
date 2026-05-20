"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faFilter, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import type { PcTransactionVariant } from "./theme";

const INPUT_CLS =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-gray-600 dark:bg-gray-900 dark:text-white";

type PcTransactionFilterCardProps = {
  variant: PcTransactionVariant;
  children: React.ReactNode;
  onReset?: () => void;
  hasActiveFilters?: boolean;
};

export function PcTransactionFilterCard({
  children,
  onReset,
  hasActiveFilters,
}: PcTransactionFilterCardProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/90">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-gray-50/80 dark:hover:bg-gray-800/60 sm:px-5"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            <FontAwesomeIcon icon={faFilter} className="text-sm" />
          </span>
          ตัวกรอง
          {hasActiveFilters ? (
            <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand-600 dark:text-brand-400">
              ใช้งานอยู่
            </span>
          ) : null}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 dark:border-gray-700 sm:px-5 sm:pb-5">
          {children}
          {onReset ? (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={onReset}
                className="text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ล้างตัวกรอง
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PcFilterField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}
      </label>
      {children}
    </div>
  );
}

export function PcFilterSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <FontAwesomeIcon
        icon={faMagnifyingGlass}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT_CLS} pl-9`}
      />
    </div>
  );
}

export { INPUT_CLS };
