"use client";

import { AdminOverlayProvider } from "@/context/AdminOverlayContext";
import { useSidebar } from "@/context/SidebarContext";
import { ToastProvider } from "@/context/ToastContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import StockQuickCheckFab from "@/components/inventory/StockQuickCheckFab";
import { useSessionCheck } from "@/hooks/useSessionCheck";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  useSessionCheck();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <ToastProvider>
      <AdminOverlayProvider>
        <div className="min-h-screen xl:flex">
          <AppSidebar />
          <Backdrop />
          <div
            className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
          >
            <AppHeader />
            <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
            <StockQuickCheckFab />
          </div>
        </div>
      </AdminOverlayProvider>
    </ToastProvider>
  );
}
