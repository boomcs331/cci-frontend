"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { QrCodeLookupPanel } from "@/components/qr/QrCodeLookupPanel";
import { StockBalanceLookupPanel } from "@/components/inventory/StockBalanceLookupPanel";
import { useAdminOverlay } from "@/context/AdminOverlayContext";
import { isSessionValid } from "@/utils/session";

type TabKey = "qrMaterial" | "qrProduct" | "stockMaterial" | "stockProduct";

const subscribeNoop = () => () => undefined;

export default function StockQuickCheckFab() {
  const { registerFullscreenOverlay } = useAdminOverlay();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("qrMaterial");

  useEffect(() => {
    if (!open) return;
    registerFullscreenOverlay(true);
    return () => registerFullscreenOverlay(false);
  }, [open, registerFullscreenOverlay]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /** Focus lookup input after switching tab (click or keyboard). */
  useEffect(() => {
    if (!open) return;
    const inputId =
      tab === "qrMaterial"
        ? "qr-lookup-input-quick-mat"
        : tab === "qrProduct"
          ? "qr-lookup-input-quick-prod"
          : tab === "stockMaterial"
            ? "stock-bal-input-quick-stock-mat"
            : "stock-bal-input-quick-stock-prod";
    const t = window.setTimeout(() => {
      document.getElementById(inputId)?.focus({ preventScroll: true });
    }, 100);
    return () => window.clearTimeout(t);
  }, [open, tab]);

  if (!mounted || !isSessionValid()) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9990] flex flex-col items-center gap-3 md:bottom-8 md:right-8">
        <Link
          href="/production/dept-step-scan"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-lg shadow-sky-500/35 transition hover:scale-105 hover:shadow-xl hover:shadow-sky-500/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/40"
          title="ยิง QR ตามแผนก (เปิดหน้าเต็ม)"
          aria-label="ไปหน้ายิง QR ตามแผนก"
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7V5a2 2 0 012-2h2M7 21H5a2 2 0 01-2-2v-2m16-10V5a2 2 0 00-2-2h-2m0 18h2a2 2 0 002-2v-2M7 7h.01M12 7h.01M17 7h.01M7 12h.01M12 12h.01M17 12h.01M7 17h.01M12 17h.01M17 17h.01"
            />
          </svg>
        </Link>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/35 transition hover:scale-105 hover:shadow-xl hover:shadow-brand-500/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/40"
          title={"\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a QR / \u0e22\u0e2d\u0e14\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d \u2014 \u0e27\u0e31\u0e15\u0e16\u0e38\u0e14\u0e34\u0e1a / \u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32"}
          aria-label={"\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a QR / \u0e22\u0e2d\u0e14\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d \u2014 \u0e27\u0e31\u0e15\u0e16\u0e38\u0e14\u0e34\u0e1a / \u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32"}
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
        </button>

        <Link
          href="/production/product-stock"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-lg shadow-violet-500/35 transition hover:scale-105 hover:shadow-xl hover:shadow-violet-500/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-400/40"
          title={"\u0e22\u0e2d\u0e14\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32 (\u0e40\u0e1b\u0e34\u0e14\u0e2b\u0e19\u0e49\u0e32\u0e40\u0e15\u0e47\u0e21)"}
          aria-label={"\u0e44\u0e1b\u0e2b\u0e19\u0e49\u0e32\u0e22\u0e2d\u0e14\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32"}
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </Link>

        <Link
          href="/pc/stock"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/35 transition hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/40"
          title={"\u0e22\u0e2d\u0e14\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d\u0e27\u0e31\u0e15\u0e16\u0e38\u0e14\u0e34\u0e1a (\u0e40\u0e1b\u0e34\u0e14\u0e2b\u0e19\u0e49\u0e32\u0e40\u0e15\u0e47\u0e21)"}
          aria-label={"\u0e44\u0e1b\u0e2b\u0e19\u0e49\u0e32\u0e22\u0e2d\u0e14\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d\u0e27\u0e31\u0e15\u0e16\u0e38\u0e14\u0e34\u0e1a"}
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </Link>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[99950] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stock-quick-check-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="max-h-[min(94vh,920px)] w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-700 dark:bg-gray-900"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 bg-gradient-to-r from-brand-50 to-blue-light-50 px-5 py-4 dark:border-gray-700 dark:from-brand-950/40 dark:to-gray-900">
              <div>
                <h2 id="stock-quick-check-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                  {"\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a QR / \u0e22\u0e2d\u0e14\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d"}
                </h2>
                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                  {
                    "\u0e15\u0e23\u0e27\u0e08\u0e25\u0e47\u0e2d\u0e15\u0e41\u0e25\u0e30\u0e2a\u0e16\u0e32\u0e19\u0e30 (QR) \u0e41\u0e22\u0e01\u0e08\u0e32\u0e01\u0e22\u0e2d\u0e14\u0e15\u0e32\u0e23\u0e32\u0e07\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d \u2014 \u0e27\u0e31\u0e15\u0e16\u0e38\u0e14\u0e34\u0e1a\u0e41\u0e25\u0e30\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32"
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200/80 dark:hover:bg-gray-700"
                aria-label="\u0e1b\u0e34\u0e14"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 border-b border-gray-200 sm:grid-cols-4 dark:border-gray-700">
              {(
                [
                  { key: "qrMaterial" as const, label: "\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a QR Material" },
                  { key: "qrProduct" as const, label: "\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a QR Products" },
                  { key: "stockMaterial" as const, label: "\u0e22\u0e2d\u0e14\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d \u0e27\u0e31\u0e15\u0e16\u0e38\u0e14\u0e34\u0e1a" },
                  { key: "stockProduct" as const, label: "\u0e22\u0e2d\u0e14\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d \u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32" },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`min-w-0 px-2 py-3 text-center text-[11px] font-medium transition sm:px-3 sm:text-sm ${
                    tab === t.key
                      ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
                      : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="max-h-[min(74vh,720px)] overflow-y-auto p-5">
              {tab === "qrMaterial" ? (
                <div className="space-y-3">
                  <QrCodeLookupPanel
                    mode="material"
                    active={open && tab === "qrMaterial"}
                    instanceId="quick-mat"
                    showUsageHint
                  />
                  <Link
                    href="/pc/outcome"
                    onClick={() => setOpen(false)}
                    className="inline-flex text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {
                      "\u0e40\u0e1b\u0e34\u0e14\u0e2b\u0e19\u0e49\u0e32\u0e08\u0e48\u0e32\u0e22\u0e2d\u0e2d\u0e01 (\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a QR \u0e41\u0e1a\u0e1a\u0e40\u0e15\u0e47\u0e21\u0e2b\u0e19\u0e49\u0e32) \u2192"
                    }
                  </Link>
                </div>
              ) : tab === "qrProduct" ? (
                <div className="space-y-3">
                  <QrCodeLookupPanel
                    mode="product"
                    active={open && tab === "qrProduct"}
                    instanceId="quick-prod"
                    showUsageHint
                  />
                  <Link
                    href="/production/production-orders"
                    onClick={() => setOpen(false)}
                    className="inline-flex text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {
                      "\u0e40\u0e1b\u0e34\u0e14\u0e04\u0e33\u0e2a\u0e31\u0e48\u0e07\u0e1c\u0e25\u0e34\u0e15 / QR \u0e25\u0e47\u0e2d\u0e15 \u2192"
                    }
                  </Link>
                </div>
              ) : tab === "stockMaterial" ? (
                <div className="space-y-3">
                  <StockBalanceLookupPanel
                    mode="material"
                    active={open && tab === "stockMaterial"}
                    instanceId="quick-stock-mat"
                    showUsageHint
                  />
                  <Link
                    href="/pc/stock"
                    onClick={() => setOpen(false)}
                    className="inline-flex text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {
                      "\u0e40\u0e1b\u0e34\u0e14\u0e2b\u0e19\u0e49\u0e32\u0e22\u0e2d\u0e14\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d\u0e27\u0e31\u0e15\u0e16\u0e38\u0e14\u0e34\u0e1a (\u0e41\u0e1a\u0e1a\u0e40\u0e15\u0e47\u0e21\u0e2b\u0e19\u0e49\u0e32) \u2192"
                    }
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <StockBalanceLookupPanel
                    mode="product"
                    active={open && tab === "stockProduct"}
                    instanceId="quick-stock-prod"
                    showUsageHint
                  />
                  <Link
                    href="/production/product-stock"
                    onClick={() => setOpen(false)}
                    className="inline-flex text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {
                      "\u0e40\u0e1b\u0e34\u0e14\u0e2b\u0e19\u0e49\u0e32\u0e22\u0e2d\u0e14\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32 (\u0e41\u0e1a\u0e1a\u0e40\u0e15\u0e47\u0e21\u0e2b\u0e19\u0e49\u0e32) \u2192"
                    }
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
