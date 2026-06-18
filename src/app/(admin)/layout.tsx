"use client";

import { AdminOverlayProvider } from "@/context/AdminOverlayContext";
import { useSidebar } from "@/context/SidebarContext";
import { ToastProvider } from "@/context/ToastContext";
import { PageTitleProvider, usePageTitle } from "@/context/PageTitleContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import StockQuickCheckFab from "@/components/inventory/StockQuickCheckFab";
import { useSessionCheck } from "@/hooks/useSessionCheck";
import React from "react";

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { title, description } = usePageTitle();

  useSessionCheck();

  // sidebar left=20px, expanded=260px, collapsed=90px, gap=20px
  // content left = sidebarLeft + sidebarWidth + gap
  // Mobile: no margin (sidebar overlays)
  // Desktop: shift content right of sidebar
  const mainContentMargin = isExpanded || isHovered
    ? "lg:ml-[300px]"  // 20 + 260 + 20
    : "lg:ml-[130px]"; // 20 + 90 + 20

  return (
    <div className="min-h-screen">
      <AppSidebar />
      <Backdrop />
      <div
        className={`transition-all duration-300 ease-in-out pt-3 px-3 sm:pt-5 sm:px-5 lg:pr-5 ${mainContentMargin}`}
      >
        <div className="mb-5">
          <AppHeader title={title} description={description} />
        </div>
        {children}
        <StockQuickCheckFab />
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <AdminOverlayProvider>
        <PageTitleProvider>
          <AdminLayoutContent>{children}</AdminLayoutContent>
        </PageTitleProvider>
      </AdminOverlayProvider>
    </ToastProvider>
  );
}
