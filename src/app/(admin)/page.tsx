"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faArrowRightToBracket,
  faArrowRight,
  faArrowRotateRight,
  faBoxesStacked,
  faChartLine,
  faClipboardCheck,
  faClockRotateLeft,
  faCubesStacked,
  faDownload,
  faIndustry,
  faListCheck,
  faPeopleCarryBox,
  faQrcode,
  faTriangleExclamation,
  faWarehouse,
} from "@fortawesome/free-solid-svg-icons";
import { OverviewHubSection, type OverviewHubItem } from "@/components/overview/OverviewHubSection";
import { dashboardFetch } from "@/utils/dashboardFetch";
import { getUserMenus } from "@/utils/session";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { PERMISSIONS } from "@/constants/permissions";
import type { MenuItem } from "@/types/user";
import { StatusDonutChart, TopBarChart, TrendLineChart } from "@/components/dashboard/DashboardCharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ensureThaiPdfFontsLoaded,
  registerThaiFontOnDoc,
  THAI_PDF_FONT,
} from "@/utils/jspdf-thai-font";

type ProductionPlanRow = {
  id: number;
  planCode: string;
  status?: string;
  planDate?: string;
  createDate?: string;
};

type ProductionOrderRow = {
  id: number;
  orderNo: string;
  status: string;
  totalLots: number;
  createDate?: string;
};

type TimeRangeKey = "today" | "7d" | "30d" | "custom" | "all";

interface DashboardRange {
  key: TimeRangeKey;
  from: Date | null;
  to: Date | null;
}

const TIME_RANGE_OPTIONS: { key: TimeRangeKey; label: string }[] = [
  { key: "today", label: "วันนี้" },
  { key: "7d", label: "7 วัน" },
  { key: "30d", label: "30 วัน" },
  { key: "all", label: "ทั้งหมด" },
  { key: "custom", label: "กำหนดเอง" },
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function computeRange(key: TimeRangeKey, custom?: { from?: string; to?: string }): DashboardRange {
  const now = new Date();
  if (key === "today") return { key, from: startOfDay(now), to: endOfDay(now) };
  if (key === "7d") {
    const from = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    return { key, from, to: endOfDay(now) };
  }
  if (key === "30d") {
    const from = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
    return { key, from, to: endOfDay(now) };
  }
  if (key === "custom") {
    const from = custom?.from ? startOfDay(new Date(custom.from)) : null;
    const to = custom?.to ? endOfDay(new Date(custom.to)) : null;
    return { key, from, to };
  }
  return { key: "all", from: null, to: null };
}

function isDateInRange(raw: string | undefined, range: DashboardRange): boolean {
  if (!raw) return false;
  const t = new Date(raw).getTime();
  if (Number.isNaN(t)) return false;
  if (range.from && t < range.from.getTime()) return false;
  if (range.to && t > range.to.getTime()) return false;
  return true;
}

function buildDailyTrend<T>(
  rows: T[],
  range: DashboardRange,
  getDate: (row: T) => string | undefined,
): { categories: string[]; counts: number[] } {
  const end = range.to ?? new Date();
  const start = range.from ?? new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
  const days = Math.min(
    31,
    Math.max(1, Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86_400_000) + 1),
  );
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = startOfDay(new Date(start.getTime() + i * 86_400_000));
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const raw = getDate(row);
    if (!raw) continue;
    const t = new Date(raw);
    if (Number.isNaN(t.getTime())) continue;
    const key = startOfDay(t).toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }
  const categories = [...buckets.keys()].map((k) => {
    const d = new Date(k);
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  });
  const counts = [...buckets.values()];
  return { categories, counts };
}

function buildDailyTrendByStatus<T>(
  rows: T[],
  range: DashboardRange,
  getDate: (row: T) => string | undefined,
  filterFn: (row: T) => boolean,
): { categories: string[]; counts: number[] } {
  const end = range.to ?? new Date();
  const start = range.from ?? new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
  const days = Math.min(
    31,
    Math.max(1, Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86_400_000) + 1),
  );
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = startOfDay(new Date(start.getTime() + i * 86_400_000));
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    if (!filterFn(row)) continue;
    const raw = getDate(row);
    if (!raw) continue;
    const t = new Date(raw);
    if (Number.isNaN(t.getTime())) continue;
    const key = startOfDay(t).toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }
  const categories = [...buckets.keys()].map((k) => {
    const d = new Date(k);
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  });
  const counts = [...buckets.values()];
  return { categories, counts };
}

type ProductionOrderListResult = {
  orders: ProductionOrderRow[];
  total: number;
};

type SalesReservationGroup = {
  totalReserved?: number;
};

type MaterialReservationDetail = {
  planCode?: string;
};

type MaterialReservationGroup = {
  materialId: number;
  materialCode: string;
  materialName: string;
  totalReserved: number;
  unit?: string;
  details?: MaterialReservationDetail[];
};

type StatusCount = {
  label: string;
  count: number;
  key: string;
};

type DashboardStats = {
  plansTotal: number;
  plansReserved: number;
  plansConfirmed: number;
  ordersTotal: number;
  openOrders: number;
  totalLots: number;
  salesReservedQty: number;
  upcomingPlans: number;
  lowStockMaterials: number;
  receivingsTotal: number;
  issuesTotal: number;
};

type MaterialStockRow = {
  id: number;
  matCode: string;
  matName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  unit: string;
};

const EMPTY_STATS: DashboardStats = {
  plansTotal: 0,
  plansReserved: 0,
  plansConfirmed: 0,
  ordersTotal: 0,
  openOrders: 0,
  totalLots: 0,
  salesReservedQty: 0,
  upcomingPlans: 0,
  lowStockMaterials: 0,
  receivingsTotal: 0,
  issuesTotal: 0,
};

const AUTO_REFRESH_MS = 60_000;

function normalizePlansPayload(raw: unknown): ProductionPlanRow[] {
  if (Array.isArray(raw)) return raw as ProductionPlanRow[];
  if (raw && typeof raw === "object" && "data" in raw) {
    const d = (raw as { data: unknown }).data;
    return Array.isArray(d) ? (d as ProductionPlanRow[]) : [];
  }
  return [];
}

function normalizeSalesReservations(raw: unknown): SalesReservationGroup[] {
  if (Array.isArray(raw)) return raw as SalesReservationGroup[];
  if (raw && typeof raw === "object") {
    const d = raw as { data?: unknown; reservations?: unknown };
    if (Array.isArray(d.data)) return d.data as SalesReservationGroup[];
    if (Array.isArray(d.reservations)) return d.reservations as SalesReservationGroup[];
  }
  return [];
}

function normalizeMaterialReservations(raw: unknown): MaterialReservationGroup[] {
  if (Array.isArray(raw)) return raw as MaterialReservationGroup[];
  if (raw && typeof raw === "object" && "data" in raw) {
    const d = (raw as { data: unknown }).data;
    return Array.isArray(d) ? (d as MaterialReservationGroup[]) : [];
  }
  return [];
}

function normalizeOrderStatus(status?: string): string {
  return (status ?? "").trim().toLowerCase();
}

function toPlanStatusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "ร่าง";
    case "reserved":
      return "จองแล้ว";
    case "confirmed":
      return "ยืนยันแล้ว";
    case "cancelled":
      return "ยกเลิก";
    default:
      return status || "unknown";
  }
}

function toOrderStatusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "ร่าง";
    case "in_progress":
    case "processing":
      return "กำลังผลิต";
    case "completed":
      return "เสร็จสิ้น";
    case "closed":
      return "ปิดงาน";
    case "cancelled":
      return "ยกเลิก";
    default:
      return status || "unknown";
  }
}

function summarizeStatuses(rows: string[], toLabel: (status: string) => string): StatusCount[] {
  const counts = new Map<string, number>();
  rows.forEach((status) => {
    const key = (status || "unknown").toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: toLabel(key), count }))
    .sort((a, b) => b.count - a.count);
}

function firstAccessiblePath(menu: MenuItem): string | null {
  if (menu.path) return menu.path;
  for (const child of menu.children || []) {
    if (child.path) return child.path;
  }
  return null;
}

function buildQuickAccessItems(menus: MenuItem[]): OverviewHubItem[] {
  return menus
    .map((menu) => {
      const path = firstAccessiblePath(menu);
      if (!path) return null;
      return {
        name: menu.label,
        path,
        icon: <FontAwesomeIcon icon={faListCheck} />,
        description: `ไปที่เมนู ${menu.label}`,
      } as OverviewHubItem;
    })
    .filter((item): item is OverviewHubItem => item !== null)
    .slice(0, 8);
}

interface KpiLinkCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: React.ReactNode;
  href?: string;
}

function KpiLinkCard({ title, value, subtitle, icon, href }: KpiLinkCardProps) {
  const content = (
    <div className="flex h-full min-h-36 flex-col group/card relative overflow-hidden justify-between rounded-xl border border-gray-200/80 bg-gradient-to-br from-white via-gray-50/50 to-brand-50/30 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/10 dark:border-gray-700/80 dark:from-gray-800 dark:via-gray-800 dark:to-brand-950/20 dark:hover:shadow-brand-500/5">
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-brand-500 via-purple-500 to-blue-500 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
          ) : null}
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-xl text-brand-600 shadow-sm dark:from-brand-500/25 dark:to-brand-950/40 dark:text-brand-400">
          {icon}
        </span>
      </div>
      {href ? (
        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-brand-600 opacity-0 transition-all duration-300 group-hover/card:opacity-100 dark:text-brand-400">
          <span>ดูรายละเอียด</span>
          <FontAwesomeIcon icon={faArrowRight} className="translate-x-0 transition-transform duration-300 group-hover/card:translate-x-1" />
        </div>
      ) : null}
    </div>
  );
  if (!href) return content;
  return (
    <Link href={href} className="group block h-full">
      {content}
    </Link>
  );
}

interface DashboardPanelProps {
  title: string;
  desc?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function ComponentCard({ title, desc, description, children, className = "" }: DashboardPanelProps) {
  const supportingText = description ?? desc;
  return (
    <section className={`overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-700/80 dark:bg-gray-800 ${className}`}>
      <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-purple-500 to-blue-500" />
      <div className="px-5 pb-4 pt-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {supportingText ? <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{supportingText}</p> : null}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [latestPlans, setLatestPlans] = useState<ProductionPlanRow[]>([]);
  const [latestOrders, setLatestOrders] = useState<ProductionOrderRow[]>([]);
  const [planStatusRows, setPlanStatusRows] = useState<StatusCount[]>([]);
  const [orderStatusRows, setOrderStatusRows] = useState<StatusCount[]>([]);
  const [topReservedMaterials, setTopReservedMaterials] = useState<MaterialReservationGroup[]>([]);
  const [reservedPlanCodeCount, setReservedPlanCodeCount] = useState(0);
  const [lowStockMaterials, setLowStockMaterials] = useState<MaterialStockRow[]>([]);
  const [upcomingPlans, setUpcomingPlans] = useState<ProductionPlanRow[]>([]);
  const [quickAccessItems, setQuickAccessItems] = useState<OverviewHubItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rangeKey, setRangeKey] = useState<TimeRangeKey>("7d");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [trendCategories, setTrendCategories] = useState<string[]>([]);
  const [trendPlans, setTrendPlans] = useState<number[]>([]);
  const [trendOrders, setTrendOrders] = useState<number[]>([]);
  const [trendOpenOrders, setTrendOpenOrders] = useState<number[]>([]);
  const [trendCompletedOrders, setTrendCompletedOrders] = useState<number[]>([]);
  const [allPlans, setAllPlans] = useState<ProductionPlanRow[]>([]);
  const [allOrders, setAllOrders] = useState<ProductionOrderRow[]>([]);
  const [allMaterialReservations, setAllMaterialReservations] = useState<MaterialReservationGroup[]>([]);
  const [allSalesGroups, setAllSalesGroups] = useState<SalesReservationGroup[]>([]);
  const [allMaterialStocks, setAllMaterialStocks] = useState<MaterialStockRow[]>([]);

  useEffect(() => {
    setQuickAccessItems(buildQuickAccessItems(getUserMenus()));
  }, []);

  const load = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const [plansRes, ordersRes, salesRes, materialReservationsRes, stockRes, receivingsRes, issuesRes] =
          await Promise.all([
          dashboardFetch("/production-plans", PERMISSIONS.PRODUCTION_PLANS_READ, []),
          dashboardFetch(
            "/production-orders?page=1&limit=100",
            PERMISSIONS.PRODUCTION_ORDERS_READ,
            { orders: [], total: 0 },
          ),
          dashboardFetch(
            "/products/sales-reservations",
            PERMISSIONS.PRODUCTS_SALES_RESERVE,
            [],
          ),
          dashboardFetch(
            "/production-plans/materials/reservations",
            PERMISSIONS.PRODUCTION_PLANS_READ,
            [],
          ),
          dashboardFetch("/materials/stock", PERMISSIONS.MATERIAL_READ, { data: [] }),
          dashboardFetch(
            "/materials/transactions/receivings?page=1&limit=1",
            PERMISSIONS.INBOUND_READ,
            { pagination: { total: 0 } },
          ),
          dashboardFetch(
            "/materials/transactions/issues?page=1&limit=1",
            PERMISSIONS.OUTBOUND_READ,
            { pagination: { total: 0 } },
          ),
        ]);

        const plans = plansRes.ok ? normalizePlansPayload(await plansRes.json()) : [];
        const orderPayload = ordersRes.ok
          ? ((await ordersRes.json()) as ProductionOrderListResult)
          : { orders: [], total: 0 };
        const salesGroups = salesRes.ok ? normalizeSalesReservations(await salesRes.json()) : [];
        const materialReservations = materialReservationsRes.ok
          ? normalizeMaterialReservations(await materialReservationsRes.json())
          : [];
        const stockPayload = stockRes.ok
          ? ((await stockRes.json()) as { success?: boolean; data?: MaterialStockRow[] })
          : null;
        const materialStocks: MaterialStockRow[] = Array.isArray(stockPayload?.data)
          ? (stockPayload!.data as MaterialStockRow[])
          : [];
        const receivingsPayload = receivingsRes.ok
          ? ((await receivingsRes.json()) as { pagination?: { total?: number } })
          : null;
        const issuesPayload = issuesRes.ok
          ? ((await issuesRes.json()) as { pagination?: { total?: number } })
          : null;

        setAllPlans(plans);
        setAllOrders(orderPayload.orders || []);
        setAllSalesGroups(salesGroups);
        setAllMaterialReservations(materialReservations);
        setAllMaterialStocks(materialStocks);
        setStats((prev) => ({
          ...prev,
          receivingsTotal: Number(receivingsPayload?.pagination?.total ?? 0),
          issuesTotal: Number(issuesPayload?.pagination?.total ?? 0),
        }));
        setLastUpdated(new Date());
      } catch (e) {
        setError(e instanceof Error ? e.message : "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ");
        setAllPlans([]);
        setAllOrders([]);
        setAllSalesGroups([]);
        setAllMaterialReservations([]);
        setAllMaterialStocks([]);
      } finally {
        if (showSpinner) setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  const range = useMemo(
    () => computeRange(rangeKey, { from: customFrom, to: customTo }),
    [rangeKey, customFrom, customTo],
  );

  useEffect(() => {
    const withinRange = <T extends { planDate?: string; createDate?: string }>(row: T): boolean => {
      if (range.key === "all") return true;
      const key = row.planDate ?? row.createDate;
      return isDateInRange(key, range);
    };

    const plansFiltered = allPlans.filter(withinRange);
    const ordersFiltered = allOrders.filter((o) =>
      range.key === "all" ? true : isDateInRange(o.createDate, range),
    );
    const salesFiltered = allSalesGroups;

    const plansReserved = plansFiltered.filter((p) => (p.status ?? "").toLowerCase() === "reserved").length;
    const plansConfirmed = plansFiltered.filter((p) => (p.status ?? "").toLowerCase() === "confirmed").length;
    const openOrders = ordersFiltered.filter((o) => {
      const s = normalizeOrderStatus(o.status);
      return s !== "completed" && s !== "closed" && s !== "cancelled";
    }).length;
    const totalLots = ordersFiltered.reduce((sum, o) => sum + Number(o.totalLots || 0), 0);
    const salesReservedQty = salesFiltered.reduce((sum, g) => sum + Number(g.totalReserved || 0), 0);

    const planStatusSummary = summarizeStatuses(
      plansFiltered.map((p) => p.status || "unknown"),
      toPlanStatusLabel,
    );
    const orderStatusSummary = summarizeStatuses(
      ordersFiltered.map((o) => o.status || "unknown"),
      toOrderStatusLabel,
    );

    const topMaterials = [...allMaterialReservations]
      .sort((a, b) => Number(b.totalReserved || 0) - Number(a.totalReserved || 0))
      .slice(0, 6);
    const reservedPlanCodes = new Set<string>();
    allMaterialReservations.forEach((m) => {
      (m.details || []).forEach((d) => {
        if (d.planCode) reservedPlanCodes.add(d.planCode);
      });
    });

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const upcoming = plansFiltered.filter((p) => {
      if (!p.planDate) return false;
      const s = (p.status ?? "").toLowerCase();
      if (s === "cancelled" || s === "confirmed") return false;
      const t = new Date(p.planDate).getTime();
      if (Number.isNaN(t)) return false;
      return t - now >= 0 && t - now <= sevenDaysMs;
    });
    const lowStocks = allMaterialStocks
      .filter(
        (m) =>
          Number(m.minStock || 0) > 0 &&
          Number(m.availableStock || 0) <= Number(m.minStock || 0),
      )
      .sort((a, b) => Number(a.availableStock || 0) - Number(b.availableStock || 0))
      .slice(0, 6);

    setStats((prev) => ({
      plansTotal: plansFiltered.length,
      plansReserved,
      plansConfirmed,
      ordersTotal: ordersFiltered.length,
      openOrders,
      totalLots,
      salesReservedQty,
      upcomingPlans: upcoming.length,
      lowStockMaterials: lowStocks.length,
      receivingsTotal: prev.receivingsTotal,
      issuesTotal: prev.issuesTotal,
    }));
    setUpcomingPlans(
      [...upcoming]
        .sort((a, b) => {
          const da = a.planDate ? new Date(a.planDate).getTime() : 0;
          const db = b.planDate ? new Date(b.planDate).getTime() : 0;
          return da - db;
        })
        .slice(0, 5),
    );
    setLowStockMaterials(lowStocks);
    setLatestPlans(
      [...plansFiltered]
        .sort((a, b) => {
          const da = a.planDate ? new Date(a.planDate).getTime() : 0;
          const db = b.planDate ? new Date(b.planDate).getTime() : 0;
          return db - da;
        })
        .slice(0, 5),
    );
    setLatestOrders(ordersFiltered.slice(0, 5));
    setPlanStatusRows(planStatusSummary);
    setOrderStatusRows(orderStatusSummary);
    setTopReservedMaterials(topMaterials);
    setReservedPlanCodeCount(reservedPlanCodes.size);

    const trendPlansData = buildDailyTrend<ProductionPlanRow>(
      plansFiltered,
      range,
      (p) => p.planDate,
    );
    const trendOrdersData = buildDailyTrend<ProductionOrderRow>(
      ordersFiltered,
      range,
      (o) => o.createDate,
    );
    const trendOpenOrdersData = buildDailyTrendByStatus<ProductionOrderRow>(
      ordersFiltered,
      range,
      (o) => o.createDate,
      (o) => {
        const s = normalizeOrderStatus(o.status);
        return s !== "completed" && s !== "closed" && s !== "cancelled";
      },
    );
    const trendCompletedOrdersData = buildDailyTrendByStatus<ProductionOrderRow>(
      ordersFiltered,
      range,
      (o) => o.createDate,
      (o) => normalizeOrderStatus(o.status) === "completed",
    );
    setTrendCategories(trendPlansData.categories);
    setTrendPlans(trendPlansData.counts);
    setTrendOrders(trendOrdersData.counts);
    setTrendOpenOrders(trendOpenOrdersData.counts);
    setTrendCompletedOrders(trendCompletedOrdersData.counts);
  }, [allPlans, allOrders, allMaterialReservations, allMaterialStocks, allSalesGroups, range]);

  useEffect(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      void load(false);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  const handleDownloadReport = useCallback(async () => {
    await ensureThaiPdfFontsLoaded();
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    registerThaiFontOnDoc(doc);
    const dateStr = new Date().toLocaleString("th-TH");
    const rangeLabel =
      range.key === "all"
        ? "ทั้งหมด"
        : range.key === "custom"
        ? `${customFrom || "—"} ถึง ${customTo || "—"}`
        : TIME_RANGE_OPTIONS.find((o) => o.key === range.key)?.label ?? "";

    doc.setFont(THAI_PDF_FONT, "bold");
    doc.setFontSize(16);
    doc.text("Dashboard Report", 14, 15);
    doc.setFont(THAI_PDF_FONT, "normal");
    doc.setFontSize(10);
    doc.text(`สร้างเมื่อ: ${dateStr}`, 14, 22);
    doc.text(`ช่วง: ${rangeLabel}`, 14, 28);

    const tableDefaults = {
      styles: {
        font: THAI_PDF_FONT,
        fontStyle: "normal" as const,
        fontSize: 10,
      },
      headStyles: {
        font: THAI_PDF_FONT,
        fontStyle: "bold" as const,
        fillColor: [55, 65, 81] as [number, number, number],
      },
    };

    autoTable(doc, {
      startY: 34,
      head: [["KPI", "Value"]],
      body: [
        ["แผนทั้งหมด (ในช่วง)", String(stats.plansTotal)],
        ["  Reserved", String(stats.plansReserved)],
        ["  Confirmed", String(stats.plansConfirmed)],
        ["คำสั่งผลิต (ในช่วง)", String(stats.ordersTotal)],
        ["  Open", String(stats.openOrders)],
        ["ล็อตในคิว", String(stats.totalLots)],
        ["ยอดจองขายรวม", stats.salesReservedQty.toLocaleString()],
        ["แผนใกล้ครบกำหนด (7 วัน)", String(stats.upcomingPlans)],
        ["วัตถุดิบใกล้หมด", String(stats.lowStockMaterials)],
        ["รายการรับเข้า", String(stats.receivingsTotal)],
        ["รายการจ่ายออก", String(stats.issuesTotal)],
      ],
      ...tableDefaults,
    });

    const afterKpi = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    autoTable(doc, {
      startY: afterKpi,
      head: [["แผนล่าสุด", "วันที่", "สถานะ"]],
      body: latestPlans.map((p) => [
        p.planCode,
        p.planDate ? new Date(p.planDate).toLocaleDateString("th-TH") : "—",
        (p.status ?? "").toUpperCase(),
      ]),
      styles: { ...tableDefaults.styles, fontSize: 9 },
      headStyles: tableDefaults.headStyles,
    });

    const afterPlans = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    autoTable(doc, {
      startY: afterPlans,
      head: [["คำสั่งผลิตล่าสุด", "Lots", "สถานะ"]],
      body: latestOrders.map((o) => [o.orderNo, String(o.totalLots), o.status]),
      styles: { ...tableDefaults.styles, fontSize: 9 },
      headStyles: tableDefaults.headStyles,
    });

    const afterOrders = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    autoTable(doc, {
      startY: afterOrders,
      head: [["Top Reserved Materials", "รหัส", "ยอดจอง", "หน่วย"]],
      body: topReservedMaterials.map((m) => [
        m.materialName,
        m.materialCode,
        Number(m.totalReserved || 0).toLocaleString(),
        m.unit || "",
      ]),
      styles: { ...tableDefaults.styles, fontSize: 9 },
      headStyles: tableDefaults.headStyles,
    });

    const afterTop = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    autoTable(doc, {
      startY: afterTop,
      head: [["วัตถุดิบใกล้หมด", "รหัส", "Available", "Min", "หน่วย"]],
      body: lowStockMaterials.map((m) => [
        m.matName,
        m.matCode,
        Number(m.availableStock || 0).toLocaleString(),
        Number(m.minStock || 0).toLocaleString(),
        m.unit || "",
      ]),
      styles: { ...tableDefaults.styles, fontSize: 9 },
      headStyles: tableDefaults.headStyles,
    });

    doc.save(`dashboard-report_${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [
    customFrom,
    customTo,
    range.key,
    stats,
    latestPlans,
    latestOrders,
    topReservedMaterials,
    lowStockMaterials,
  ]);

  return (
    <div className="space-y-5 pb-6">
      <header className="relative overflow-hidden flex flex-col gap-4 rounded-xl border border-gray-200/80 bg-gradient-to-br from-white via-gray-50/50 to-brand-50/30 p-6 dark:border-gray-700/80 dark:from-gray-800 dark:via-gray-800 dark:to-brand-950/20 md:flex-row md:items-end md:justify-between">
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-brand-500 via-purple-500 to-blue-500" />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">Dashboard</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">ภาพรวมการดำเนินงาน</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            ติดตามแผน คำสั่งผลิต วัตถุดิบ และรายการคลังตามสิทธิ์และแผนกที่เลือก
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
          {lastUpdated
            ? `อัปเดตล่าสุด ${lastUpdated.toLocaleTimeString("th-TH")}`
            : loading
              ? "กำลังโหลดข้อมูลล่าสุด"
              : "ยังไม่ได้โหลดข้อมูล"}
        </div>
      </header>

      <div data-testid="dashboard-command-bar" className="flex flex-col gap-4 rounded-xl border border-gray-200/80 bg-gradient-to-br from-white via-gray-50/50 to-brand-50/30 p-5 text-sm dark:border-gray-700/80 dark:from-gray-800 dark:via-gray-800 dark:to-brand-950/20 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">ช่วงเวลาสำหรับแผนและคำสั่งผลิต</p>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="เลือกช่วงเวลา">
          {TIME_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setRangeKey(opt.key)}
              aria-pressed={rangeKey === opt.key}
              className={`min-h-9 rounded-md px-3 text-xs font-medium transition ${
                rangeKey === opt.key
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
          </div>
          {rangeKey === "custom" && (
            <div className="mt-3 grid max-w-lg grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="จากวันที่"
                  value={customFrom ? dayjs(customFrom) : null}
                  onChange={(newValue) => setCustomFrom(newValue ? newValue.format('YYYY-MM-DD') : '')}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: { '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', minHeight: '40px' } },
                    },
                    popper: { sx: { zIndex: 999999 } },
                    dialog: { sx: { zIndex: 999999 } },
                  }}
                />
              </LocalizationProvider>
              <span className="hidden text-xs text-gray-500 sm:block">ถึง</span>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="ถึงวันที่"
                  value={customTo ? dayjs(customTo) : null}
                  onChange={(newValue) => setCustomTo(newValue ? newValue.format('YYYY-MM-DD') : '')}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: { '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', minHeight: '40px' } },
                    },
                    popper: { sx: { zIndex: 999999 } },
                    dialog: { sx: { zIndex: 999999 } },
                  }}
                />
              </LocalizationProvider>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
          <label className="flex cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400"
            />
            อัปเดตอัตโนมัติ 60 วินาที
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => void handleDownloadReport().catch((e) => console.error(e))}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <FontAwesomeIcon icon={faDownload} />
            ดาวน์โหลดรายงาน
          </button>
          <button
            type="button"
            onClick={() => void load(false)}
            disabled={refreshing}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-500 px-3 text-white hover:bg-brand-600 disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faArrowRotateRight} className={refreshing ? "animate-spin" : ""} />
            รีเฟรช
          </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => void load(false)} className="self-start font-semibold underline underline-offset-4 sm:self-auto">
            ลองอีกครั้ง
          </button>
        </div>
      )}

      <section data-testid="dashboard-metrics" aria-labelledby="dashboard-metrics-title">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="dashboard-metrics-title" className="text-base font-semibold text-gray-900 dark:text-white">ตัวชี้วัดสำคัญ</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">ภาพรวมสถานะปัจจุบันตามขอบเขตข้อมูลของแต่ละระบบ</p>
          </div>
          <span className="text-xs text-gray-400">แผนและคำสั่งผลิตอิงช่วงเวลาที่เลือก</span>
        </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiLinkCard
          title="แผนการผลิต"
          value={loading ? "—" : stats.plansTotal}
          subtitle={`จองแล้ว ${stats.plansReserved} / ยืนยันแล้ว ${stats.plansConfirmed}`}
          icon={<FontAwesomeIcon icon={faClipboardCheck} className="text-brand-500" />}
          href="/pc/schedule/reservations"
        />
        <KpiLinkCard
          title="คำสั่งผลิต"
          value={loading ? "—" : stats.ordersTotal}
          subtitle={`กำลังดำเนินการ ${stats.openOrders} รายการ`}
          icon={<FontAwesomeIcon icon={faQrcode} className="text-blue-light-500" />}
          href="/production/production-orders"
        />
        <KpiLinkCard
          title="ล็อตในคิว"
          value={loading ? "—" : stats.totalLots}
          subtitle="จากคำสั่งผลิตที่โหลดสูงสุด 100 รายการ"
          icon={<FontAwesomeIcon icon={faCubesStacked} className="text-success-500" />}
          href="/production/production-orders?page=1&limit=10"
        />
        <KpiLinkCard
          title="ยอดจองขายรวม"
          value={loading ? "—" : stats.salesReservedQty.toLocaleString()}
          subtitle="ยอดสะสมปัจจุบัน ไม่อิงช่วงเวลา"
          icon={<FontAwesomeIcon icon={faBoxesStacked} className="text-orange-500" />}
          href="/production/sales-reservations"
        />
        <KpiLinkCard
          title="แผนใกล้ครบกำหนด"
          value={loading ? "—" : stats.upcomingPlans}
          subtitle="ภายใน 7 วัน (ยังไม่ confirmed)"
          icon={<FontAwesomeIcon icon={faClockRotateLeft} className="text-warning-500" />}
          href="/pc/schedule/reservations"
        />
        <KpiLinkCard
          title="วัตถุดิบใกล้หมด"
          value={loading ? "—" : stats.lowStockMaterials}
          subtitle="คงเหลือพร้อมใช้ต่ำกว่าหรือเท่ากับขั้นต่ำ"
          icon={<FontAwesomeIcon icon={faWarehouse} className="text-red-500" />}
          href="/pc/stock"
        />
        <KpiLinkCard
          title="รายการรับเข้า"
          value={loading ? "—" : stats.receivingsTotal}
          subtitle="ใบรับวัตถุดิบทั้งหมดในระบบ"
          icon={<FontAwesomeIcon icon={faArrowRightToBracket} className="text-success-500" />}
          href="/pc/income"
        />
        <KpiLinkCard
          title="รายการจ่ายออก"
          value={loading ? "—" : stats.issuesTotal}
          subtitle="ใบจ่ายวัตถุดิบทั้งหมดในระบบ"
          icon={<FontAwesomeIcon icon={faArrowRightFromBracket} className="text-orange-500" />}
          href="/pc/outcome"
        />
      </div>
      </section>

      <section data-testid="dashboard-trends" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ComponentCard title="แนวโน้มแผนและคำสั่งผลิต" desc="นับจำนวนกิจกรรมในแต่ละวันตามช่วงเวลาที่เลือก">
        <TrendLineChart
          categories={trendCategories}
          series={[
            { name: "แผน", data: trendPlans },
            { name: "คำสั่งผลิต", data: trendOrders },
          ]}
        />
      </ComponentCard>

      <ComponentCard title="แนวโน้มสถานะคำสั่งผลิต" desc="เปรียบเทียบงานที่กำลังดำเนินการและเสร็จสิ้น">
        <TrendLineChart
          categories={trendCategories}
          series={[
            { name: "กำลังดำเนินการ", data: trendOpenOrders },
            { name: "เสร็จสิ้น", data: trendCompletedOrders },
          ]}
        />
      </ComponentCard>
      </section>

      <div data-testid="dashboard-operations" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ComponentCard title="สถานะแผนล่าสุด" desc="ติดตามแผนที่เพิ่งสร้างหรืออัปเดตล่าสุด">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
          ) : latestPlans.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">ไม่มีข้อมูลแผน</p>
          ) : (
            <div className="space-y-3">
              {latestPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/pc/schedule/reservations/${plan.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{plan.planCode}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {plan.planDate ? new Date(plan.planDate).toLocaleDateString("th-TH") : "—"}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {(plan.status || "unknown").toUpperCase()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </ComponentCard>

        <ComponentCard title="คำสั่งผลิตล่าสุด" desc="เข้ารายการเพื่อดูหรือพิมพ์ QR ได้ทันที">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
          ) : latestOrders.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">ไม่มีข้อมูลคำสั่งผลิต</p>
          ) : (
            <div className="space-y-3">
              {latestOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/production/production-orders/${order.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{order.orderNo}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Lots {order.totalLots} • {order.status}
                    </p>
                  </div>
                  <FontAwesomeIcon icon={faChartLine} className="text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </ComponentCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ComponentCard title="สัดส่วนสถานะแผน" desc="จากแผนทั้งหมดในระบบ">
          <StatusDonutChart
            labels={planStatusRows.map((r) => r.label)}
            series={planStatusRows.map((r) => r.count)}
          />
        </ComponentCard>
        <ComponentCard title="สัดส่วนสถานะคำสั่งผลิต" desc="จาก 10 รายการล่าสุด">
          <StatusDonutChart
            labels={orderStatusRows.map((r) => r.label)}
            series={orderStatusRows.map((r) => r.count)}
          />
        </ComponentCard>
      </div>

      <ComponentCard
        title="วัตถุดิบที่ถูกจองสูงสุด"
        desc="เปรียบเทียบยอดจองสูงสุดเพื่อดูวัตถุดิบที่ถูกใช้งานหนัก"
      >
        <TopBarChart
          categories={topReservedMaterials.map((m) => `${m.materialCode} ${m.materialName}`)}
          series={[
            {
              name: "ยอดจอง",
              data: topReservedMaterials.map((m) => Number(m.totalReserved || 0)),
            },
          ]}
        />
      </ComponentCard>

      <div data-testid="dashboard-alerts" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ComponentCard title="แผนใกล้ครบกำหนด (7 วัน)" desc="จัดลำดับตามวันที่แผน">
          {upcomingPlans.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">ไม่มีแผนใกล้ครบกำหนด</p>
          ) : (
            <div className="space-y-3">
              {upcomingPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/pc/schedule/reservations/${plan.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{plan.planCode}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {plan.planDate ? new Date(plan.planDate).toLocaleDateString("th-TH") : "—"}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {(plan.status || "unknown").toUpperCase()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </ComponentCard>

        <ComponentCard title="วัตถุดิบใกล้หมด" desc="เปรียบเทียบ Available กับ Min Stock">
          {lowStockMaterials.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ไม่พบวัตถุดิบต่ำกว่า min stock
            </p>
          ) : (
            <div className="space-y-2">
              {lowStockMaterials.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {m.matName}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{m.matCode}</p>
                  </div>
                  <span className="text-xs text-red-600 dark:text-red-400">
                    {Number(m.availableStock || 0).toLocaleString()} / {Number(m.minStock || 0).toLocaleString()} {m.unit || ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ComponentCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ComponentCard
          title="รายละเอียดงานผลิต"
          desc="สรุปสถานะของแผนและคำสั่งผลิต เพื่อช่วยติดตามคอขวดงานผลิต"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                <FontAwesomeIcon icon={faIndustry} className="text-brand-500" />
                สถานะแผนการผลิต
              </div>
              {planStatusRows.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">ไม่มีข้อมูล</p>
              ) : (
                <div className="space-y-2">
                  {planStatusRows.map((row) => (
                    <Link
                      key={row.key}
                      href={`/pc/schedule/reservations?status=${encodeURIComponent(row.key)}`}
                      className="flex items-center justify-between rounded-md px-2 py-1 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    >
                      <span className="text-gray-600 dark:text-gray-400">{row.label}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{row.count}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                <FontAwesomeIcon icon={faQrcode} className="text-blue-light-500" />
                สถานะคำสั่งผลิต
              </div>
              {orderStatusRows.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">ไม่มีข้อมูล</p>
              ) : (
                <div className="space-y-2">
                  {orderStatusRows.map((row) => (
                    <Link
                      key={row.key}
                      href={`/production/production-orders?status=${encodeURIComponent(row.key)}`}
                      className="flex items-center justify-between rounded-md px-2 py-1 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    >
                      <span className="text-gray-600 dark:text-gray-400">{row.label}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{row.count}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href="/pc/schedule/reservations"
              className="rounded-full border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ไปหน้า Schedule Reservations
            </Link>
            <Link
              href="/production/production-orders"
              className="rounded-full border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ไปหน้า Production Orders
            </Link>
          </div>
        </ComponentCard>

        <ComponentCard
          title="รายละเอียดวัตถุดิบ"
          desc="ติดตามวัตถุดิบที่จองสูงสุดและจำนวนแผนที่กำลังใช้วัตถุดิบ"
        >
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                <FontAwesomeIcon icon={faWarehouse} className="text-orange-500" />
                วัตถุดิบที่ถูกจองสูงสุด
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                แผนที่เกี่ยวข้อง {reservedPlanCodeCount}
              </span>
            </div>
            {topReservedMaterials.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">ไม่มีข้อมูลการจองวัตถุดิบ</p>
            ) : (
              <div className="space-y-2">
                {topReservedMaterials.map((m) => (
                  <Link
                    key={m.materialId}
                    href={`/pc/schedule/reservations/picking-slip?materialId=${m.materialId}`}
                    className="flex items-center justify-between rounded-md px-2 py-1 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {m.materialName}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {m.materialCode}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {Number(m.totalReserved || 0).toLocaleString()} {m.unit || ""}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href="/pc/schedule/reservations/picking-slip"
              className="rounded-full border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ไปหน้า Picking Slip
            </Link>
            <Link
              href="/pc/stock"
              className="rounded-full border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ไปหน้า Material Stock
            </Link>
          </div>
        </ComponentCard>
      </div>

      <div data-testid="dashboard-shortcuts">
      <OverviewHubSection
        title="ทางลัดเมนูหลัก"
        sectionDescription="เปิดใช้งานงานประจำได้เร็วขึ้นตามสิทธิ์ที่ได้รับ"
        icon={<FontAwesomeIcon icon={faPeopleCarryBox} />}
        items={
          quickAccessItems.length > 0
            ? quickAccessItems
            : [
                {
                  name: "Schedule Reservations",
                  path: "/pc/schedule/reservations",
                  description: "ไปจัดการคิวแผนการผลิต",
                  icon: <FontAwesomeIcon icon={faClockRotateLeft} />,
                },
              ]
        }
      />
      </div>
    </div>
  );
}
