"use client";

import React, { useEffect } from "react";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertModalProps {
  show: boolean;
  variant?: AlertVariant;
  title: string;
  message?: string;
  onClose: () => void;
}

const VARIANT_CONFIG: Record<AlertVariant, {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  button: string;
}> = {
  success: {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    button: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500",
  },
  error: {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    iconBg: "bg-red-100 dark:bg-red-500/15",
    iconColor: "text-red-600 dark:text-red-400",
    button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
  },
  warning: {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
    button: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400",
  },
  info: {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
      </svg>
    ),
    iconBg: "bg-blue-100 dark:bg-blue-500/15",
    iconColor: "text-blue-600 dark:text-blue-400",
    button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
  },
};

export default function AlertModal({ show, variant = "info", title, message, onClose }: AlertModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (show) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [show, onClose]);

  if (!show) return null;
  const cfg = VARIANT_CONFIG[variant];

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-cci-backdrop-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-cci-popup ring-1 ring-black/5 dark:ring-white/10 animate-cci-modal-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${cfg.iconBg} ${cfg.iconColor}`}>
            {cfg.icon}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{title}</p>
            {message && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 rounded-lg ${cfg.button} text-white text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900`}
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
}
