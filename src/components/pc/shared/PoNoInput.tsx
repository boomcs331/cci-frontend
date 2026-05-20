"use client";

import React, { useCallback, useEffect, useId, useState } from "react";
import {
  applyPoNoInput,
  getPoNoErrorMessage,
  mergePoNoPaste,
  PO_NO_MAX_LENGTH,
} from "@/lib/pc";

export interface PoNoInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onValidityChange?: (valid: boolean) => void;
  /** Show errors even before blur (e.g. after submit attempt). */
  forceShowErrors?: boolean;
}

/** เลขที่ PO — อนุญาตเฉพาะ A-Z, a-z, 0-9 */
export default function PoNoInput({
  value,
  onChange,
  label = "เลขที่ PO *",
  placeholder = "เช่น PO2026, PO-001, #PO123",
  disabled = false,
  className = "",
  onValidityChange,
  forceShowErrors = false,
}: PoNoInputProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const [touched, setTouched] = useState(false);
  const error = getPoNoErrorMessage(value);
  const showError = (touched || forceShowErrors) && !!error;

  useEffect(() => {
    onValidityChange?.(getPoNoErrorMessage(value) === null);
  }, [value, onValidityChange]);

  const updateValue = useCallback(
    (next: string) => {
      onChange(next);
      onValidityChange?.(getPoNoErrorMessage(next) === null);
    },
    [onChange, onValidityChange],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTouched(true);
    updateValue(applyPoNoInput(e.target.value));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setTouched(true);
    updateValue(mergePoNoPaste(value, e.clipboardData.getData("text")));
  };

  const handleBlur = () => {
    setTouched(true);
    onValidityChange?.(getPoNoErrorMessage(value) === null);
  };

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        onBlur={handleBlur}
        disabled={disabled}
        required
        className={`h-11 w-full rounded-lg border px-4 bg-white text-gray-900 dark:bg-gray-900 dark:text-white ${
          showError
            ? "border-red-500 dark:border-red-500"
            : "border-gray-300 dark:border-gray-600"
        }`}
        placeholder={placeholder}
        maxLength={PO_NO_MAX_LENGTH}
        title="ภาษาอังกฤษ ตัวเลข และอักขระพิเศษได้ (ไม่รองรับภาษาไทย)"
        inputMode="text"
        autoComplete="off"
        aria-invalid={showError}
        aria-describedby={showError ? `${hintId} ${errorId}` : hintId}
      />
      <p id={hintId} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        ใช้ได้ภาษาอังกฤษ ตัวเลข และอักขระพิเศษ เช่น - _ / # (ไม่รองรับภาษาไทย)
      </p>
      {showError && (
        <p id={errorId} className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function validatePoNoField(value: string): string | null {
  return getPoNoErrorMessage(value);
}
