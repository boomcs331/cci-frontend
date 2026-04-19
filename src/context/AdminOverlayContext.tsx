"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type AdminOverlayContextValue = {
  /** true เมื่อมี modal เต็มจอที่ต้องซ่อนแถบบน (navbar) */
  hideTopChrome: boolean;
  registerFullscreenOverlay: (open: boolean) => void;
};

const AdminOverlayContext = createContext<AdminOverlayContextValue | null>(null);

export function AdminOverlayProvider({ children }: { children: React.ReactNode }) {
  const [overlayCount, setOverlayCount] = useState(0);

  const registerFullscreenOverlay = useCallback((open: boolean) => {
    setOverlayCount((c) => (open ? c + 1 : Math.max(0, c - 1)));
  }, []);

  const value = useMemo<AdminOverlayContextValue>(
    () => ({
      hideTopChrome: overlayCount > 0,
      registerFullscreenOverlay,
    }),
    [overlayCount, registerFullscreenOverlay],
  );

  return <AdminOverlayContext.Provider value={value}>{children}</AdminOverlayContext.Provider>;
}

export function useAdminOverlay(): AdminOverlayContextValue {
  const ctx = useContext(AdminOverlayContext);
  if (!ctx) {
    return {
      hideTopChrome: false,
      registerFullscreenOverlay: () => {},
    };
  }
  return ctx;
}
