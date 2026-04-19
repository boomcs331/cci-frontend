"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastContextValue {
  show: (toast: Omit<ToastItem, "id"> & { id?: string }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

type ToastBusListener = (toast: Omit<ToastItem, "id"> & { id?: string }) => void;
const busListeners = new Set<ToastBusListener>();

/** Publish a toast from anywhere (including non-React modules like apiFetch). */
export function publishToast(toast: Omit<ToastItem, "id"> & { id?: string }): void {
  for (const listener of busListeners) {
    try {
      listener(toast);
    } catch {
      /* ignore listener errors */
    }
  }
}

function generateId(): string {
  if (typeof globalThis !== "undefined" && "crypto" in globalThis) {
    const c = (globalThis as { crypto?: Crypto }).crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
    if (c && typeof c.getRandomValues === "function") {
      const a = new Uint32Array(2);
      c.getRandomValues(a);
      return `t-${a[0].toString(36)}${a[1].toString(36)}`;
    }
  }
  return `t-${String(performance.now()).replace(".", "")}`;
}

const VARIANT_STYLES: Record<
  ToastVariant,
  { ring: string; dot: string; iconBg: string }
> = {
  success: {
    ring: "ring-success-500/30",
    dot: "bg-success-500",
    iconBg: "bg-success-500/15 text-success-600 dark:text-success-300",
  },
  error: {
    ring: "ring-error-500/30",
    dot: "bg-error-500",
    iconBg: "bg-error-500/15 text-error-600 dark:text-error-300",
  },
  warning: {
    ring: "ring-warning-500/30",
    dot: "bg-warning-500",
    iconBg: "bg-warning-500/15 text-warning-700 dark:text-warning-300",
  },
  info: {
    ring: "ring-blue-light-500/30",
    dot: "bg-blue-light-500",
    iconBg: "bg-blue-light-500/15 text-blue-light-600 dark:text-blue-light-300",
  },
};

function VariantGlyph({ variant }: { variant: ToastVariant }) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${VARIANT_STYLES[variant].iconBg}`}
      aria-hidden
    >
      <span className={`h-2 w-2 rounded-full ${VARIANT_STYLES[variant].dot}`} />
    </span>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const show = useCallback<ToastContextValue["show"]>(
    (input) => {
      const id = input.id ?? generateId();
      const duration = input.durationMs ?? 4000;
      const toast: ToastItem = {
        id,
        variant: input.variant,
        title: input.title,
        message: input.message,
        durationMs: duration,
      };
      setToasts((prev) => {
        const next = prev.filter((t) => t.id !== id);
        next.push(toast);
        return next.slice(-5);
      });
      if (duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const clear = useCallback(() => {
    setToasts([]);
    for (const t of Object.values(timers.current)) clearTimeout(t);
    timers.current = {};
  }, []);

  useEffect(() => {
    const listener: ToastBusListener = (toast) => {
      show(toast);
    };
    busListeners.add(listener);
    return () => {
      busListeners.delete(listener);
    };
  }, [show]);

  useEffect(() => {
    return () => {
      for (const t of Object.values(timers.current)) clearTimeout(t);
      timers.current = {};
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss, clear }), [show, dismiss, clear]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed right-4 top-4 z-[100000] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl border border-gray-200 bg-white p-3 shadow-lg ring-1 dark:border-gray-700 dark:bg-gray-900 ${VARIANT_STYLES[t.variant].ring}`}
          >
            <div className="flex items-start gap-3">
              <VariantGlyph variant={t.variant} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t.title}
                </p>
                {t.message ? (
                  <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                    {t.message}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Dismiss notification"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
