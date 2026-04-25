"use client";

import React from "react";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertModalProps {
  show: boolean;
  variant?: AlertVariant;
  title: string;
  message?: string;
  onClose: () => void;
}

const VARIANT_CONFIG: Record<AlertVariant, { icon: React.ReactNode; iconBg: string; titleColor: string }> = {
  success: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    iconBg: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    titleColor: "text-green-700 dark:text-green-300",
  },
  error: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    iconBg: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    titleColor: "text-red-700 dark:text-red-300",
  },
  warning: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    titleColor: "text-amber-700 dark:text-amber-300",
  },
  info: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
      </svg>
    ),
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    titleColor: "text-blue-700 dark:text-blue-300",
  },
};

export default function AlertModal({ show, variant = "info", title, message, onClose }: AlertModalProps) {
  if (!show) return null;
  const cfg = VARIANT_CONFIG[variant];
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center gap-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${cfg.iconBg}`}>
          {cfg.icon}
        </div>
        <div>
          <p className={`text-lg font-semibold ${cfg.titleColor}`}>{title}</p>
          {message && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{message}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          ตกลง
        </button>
      </div>
    </div>
  );
}
