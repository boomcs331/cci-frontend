"use client";

import React, { useEffect } from "react";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastProps {
  show: boolean;
  variant?: ToastVariant;
  title: string;
  message?: string;
  onClose: () => void;
  duration?: number;
}

const VARIANT_CONFIG: Record<ToastVariant, {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  border: string;
}> = {
  success: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500 dark:border-emerald-400",
  },
  error: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    iconBg: "bg-red-100 dark:bg-red-500/15",
    iconColor: "text-red-600 dark:text-red-400",
    border: "border-red-500 dark:border-red-400",
  },
  warning: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500 dark:border-amber-400",
  },
  info: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
      </svg>
    ),
    iconBg: "bg-blue-100 dark:bg-blue-500/15",
    iconColor: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500 dark:border-blue-400",
  },
};

export default function Toast({ show, variant = "info", title, message, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (show) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [show, onClose]);

  if (!show) return null;
  const cfg = VARIANT_CONFIG[variant];

  return (
    <div className="fixed bottom-4 left-4 z-[99999] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className={`flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg border-l-4 ${cfg.border} max-w-md`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.iconBg} ${cfg.iconColor}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
          {message && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{message}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
