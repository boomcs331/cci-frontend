"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import QRCodeGenerator from "@/components/common/QRCodeGenerator";
import { apiFetch } from "@/utils/api";
import {
  getSession,
  getUserDepartmentCode,
  isAdmin,
  type SessionUser,
} from "@/utils/session";
import { resolveOperatorLabel } from "@/utils/resolveStoredUserLabel";

type StationProcess = {
  processId: number;
  processCode: string;
  processName: string;
  allowedDepartmentCodes: string[] | null;
};

type TrackingRow = {
  status: string;
  processCode: string | null;
  processName: string | null;
  startTime: string | null;
  endTime: string | null;
  operator: string | null;
  remarks: string | null;
};

type InProgressLot = {
  lotNo: string;
  qrCode: string;
  quantity: number;
  status?: string;
  orderNo: string;
  productCode: string;
  productName: string;
  currentProcessCode: string | null;
  currentProcessName: string | null;
  allowedDepartmentCodes: string[] | null;
};

type LotStationPayload = {
  lotNo: string;
  qrCode: string;
  quantity: number;
  status: string;
  orderNo: string;
  productCode: string;
  productName: string;
  userDepartmentCode: string | null;
  isAdminGlobal: boolean;
  currentStepPhase?: "IN_PROGRESS" | "WAITING_START" | "COMPLETED";
  stepSummaryTh?: string;
  departmentAlertTh?: string | null;
  route: StationProcess[];
  inProgress: (StationProcess & { startTime: string }) | null;
  expectedProcess: StationProcess | null;
  nextAction: "start" | "complete" | "none";
  canStart: boolean;
  canComplete: boolean;
  completeProcessId: number | null;
  denyReason: string | null;
};

type SplitChildLot = {
  id: number;
  lotNo: string;
  orderNoRef?: string | null;
  qrCode: string;
  quantity: number;
  status: string;
  currentProcessId: number | null;
};

type SplitResultPayload = {
  sourceLot: {
    id: number;
    lotNo: string;
    orderNoRef?: string | null;
    qrCode: string;
    quantity: number;
    status: string;
    retired: boolean;
  };
  children: SplitChildLot[];
};

type LineageLot = {
  id: number;
  lotNo: string;
  orderNoRef?: string | null;
  qrCode: string;
  quantity: number;
  status: string;
  parentLotId: number | null;
  splitReason: string | null;
  currentProcessCode: string | null;
  currentProcessName: string | null;
};

type LotLineagePayload = {
  lot: LineageLot | null;
  parent: LineageLot | null;
  children: LineageLot[];
  order: {
    id: number;
    orderNo: string;
    productCode: string | null;
    productName: string | null;
  };
};

export default function DeptStepScanPage() {
  const [qrInput, setQrInput] = useState("");
  const [station, setStation] = useState<LotStationPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  /** Read session only after mount so SSR + first client paint match (avoids hydration mismatch). */
  const [sessionDept, setSessionDept] = useState<string | null>(null);
  const [sessionAdmin, setSessionAdmin] = useState(false);
  const [myDeptLots, setMyDeptLots] = useState<InProgressLot[]>([]);
  const [deptLotsLoading, setDeptLotsLoading] = useState(false);
  const [deptPage, setDeptPage] = useState(1);
  const [expandedQr, setExpandedQr] = useState<string | null>(null);
  const [trackingMap, setTrackingMap] = useState<Record<string, TrackingRow[]>>({});
  const [trackingLoadingQr, setTrackingLoadingQr] = useState<string | null>(null);
  const [lineageMap, setLineageMap] = useState<Record<string, LotLineagePayload>>({});
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitQuantity, setSplitQuantity] = useState<string>("");
  const [splitReason, setSplitReason] = useState("");
  const [splitLoading, setSplitLoading] = useState(false);
  const [splitResult, setSplitResult] = useState<SplitResultPayload | null>(null);
  const [lineage, setLineage] = useState<LotLineagePayload | null>(null);
  const [lineageLoading, setLineageLoading] = useState(false);
  const [quickSplitQr, setQuickSplitQr] = useState<string | null>(null);
  const [quickSplitQty, setQuickSplitQty] = useState<string>("");
  const [quickSplitReason, setQuickSplitReason] = useState("");
  const [quickSplitLoading, setQuickSplitLoading] = useState(false);
  const DEPT_PAGE_SIZE = 10;
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  const getOperator = useCallback((): string => {
    const username = getSession()?.user?.username?.trim();
    return username || "scanner";
  }, []);

  useEffect(() => {
    setSessionUser(getSession()?.user ?? null);
    setSessionDept(getUserDepartmentCode());
    setSessionAdmin(isAdmin());
  }, []);

  const loadMyDeptLots = useCallback(async () => {
    setDeptLotsLoading(true);
    try {
      const res = await apiFetch("/production-orders/in-progress/my-dept");
      if (res.ok) {
        setMyDeptLots((await res.json()) as InProgressLot[]);
      } else if (res.status === 403) {
        setMyDeptLots([]);
        setError("ไม่มีสิทธิ์ดูรายการล็อตของแผนก (ต้องมี production_orders.read หรือ update)");
      }
    } finally {
      setDeptLotsLoading(false);
    }
  }, []);

  const toggleTracking = useCallback(async (qrCode: string) => {
    if (expandedQr === qrCode) { setExpandedQr(null); return; }
    setExpandedQr(qrCode);
    const hasTracking = Boolean(trackingMap[qrCode]);
    const hasLineage = Boolean(lineageMap[qrCode]);
    if (hasTracking && hasLineage) return;
    setTrackingLoadingQr(qrCode);
    try {
      if (!hasTracking) {
        const resTracking = await apiFetch(`/production-orders/lots/${encodeURIComponent(qrCode)}/tracking`);
        if (resTracking.ok) {
          const data = (await resTracking.json()) as TrackingRow[];
          setTrackingMap((prev) => ({ ...prev, [qrCode]: data }));
        }
      }
      if (!hasLineage) {
        const resLineage = await apiFetch(
          `/production-orders/lots/${encodeURIComponent(qrCode)}/lineage`,
        );
        if (resLineage.ok) {
          const lineageData = (await resLineage.json()) as LotLineagePayload;
          setLineageMap((prev) => ({ ...prev, [qrCode]: lineageData }));
        }
      }
    } finally {
      setTrackingLoadingQr(null);
    }
  }, [expandedQr, lineageMap, trackingMap]);

  useEffect(() => { void loadMyDeptLots(); }, [loadMyDeptLots]);

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(t);
  }, []);

  const loadStation = useCallback(async (rawCode?: string | null) => {
    const code = (rawCode ?? "").trim();
    if (!code) {
      setError("Enter or scan a production lot QR value.");
      return null as LotStationPayload | null;
    }
    setError(null);
    setLoading(true);
    setStation(null);
    setSplitResult(null);
    try {
      const res = await apiFetch(
        `/production-orders/lots/${encodeURIComponent(code)}/station`,
      );
      if (res.status === 404) {
        setError("No production lot found for this code.");
        return null;
      }
      if (res.status === 403) {
        setError("Not allowed (requires production_orders.read).");
        return null;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          (body?.message as string) ||
            (body?.error as string) ||
            "Could not load station state.",
        );
        return null;
      }
      const data = (await res.json()) as LotStationPayload;
      setStation(data);
      setSplitQuantity("");
      setSplitReason("");
      setSplitOpen(false);
      setQrInput("");
      return data;
    } catch {
      setError("Network error.");
      return null;
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, []);

  const loadLineage = useCallback(async (qrCode?: string | null) => {
    const code = (qrCode ?? "").trim();
    if (!code) {
      setLineage(null);
      return;
    }
    setLineageLoading(true);
    try {
      const res = await apiFetch(
        `/production-orders/lots/${encodeURIComponent(code)}/lineage`,
      );
      if (!res.ok) {
        setLineage(null);
        return;
      }
      setLineage((await res.json()) as LotLineagePayload);
    } finally {
      setLineageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!station?.qrCode) return;
    void loadLineage(station.qrCode);
  }, [loadLineage, station?.qrCode]);

  const refreshAfterComplete = useCallback((qrCode: string) => {
    void loadMyDeptLots();
    setTrackingMap((prev) => { const n = { ...prev }; delete n[qrCode]; return n; });
    setLineageMap((prev) => { const n = { ...prev }; delete n[qrCode]; return n; });
    // ไม่ clear station เพื่อให้สแกนต่อไปได้ทันทีเลย
    setStation(null);
    setLineage(null);
    setSplitResult(null);
    inputRef.current?.focus();
  }, [loadMyDeptLots]);

  const advanceStepForStation = useCallback(
    async (target: LotStationPayload) => {
      if (!target.qrCode || target.status === "COMPLETED") return;

      if (target.nextAction === "complete" && target.completeProcessId) {
        const safeRemarks = (remarks ?? "").trim();
        const completeRes = await apiFetch(
          `/production-orders/lots/${encodeURIComponent(target.qrCode)}/complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              processId: target.completeProcessId,
              remarks:
                safeRemarks ||
                target.inProgress?.processName ||
                target.inProgress?.processCode ||
                "complete",
            }),
          },
        );
        if (!completeRes.ok) {
          const body = await completeRes.json().catch(() => ({}));
          setError(
            (body?.message as string) ||
              (body?.error as string) ||
              "Complete step failed.",
          );
          return;
        }
        setRemarks("");
        refreshAfterComplete(target.qrCode);
        return;
      }

      if (target.nextAction === "start" && target.expectedProcess) {
        const pid = target.expectedProcess.processId;
        const safeRemarks = (remarks ?? "").trim();

        const startRes = await apiFetch(
          `/production-orders/lots/${encodeURIComponent(target.qrCode)}/start`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              processId: pid,
              operator: getOperator(),
            }),
          },
        );
        if (!startRes.ok) {
          const body = await startRes.json().catch(() => ({}));
          setError(
            (body?.message as string) ||
              (body?.error as string) ||
              "Start step failed.",
          );
          return;
        }

        const completeRes = await apiFetch(
          `/production-orders/lots/${encodeURIComponent(target.qrCode)}/complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              processId: pid,
              remarks:
                safeRemarks ||
                target.expectedProcess?.processName ||
                target.expectedProcess?.processCode ||
                "complete",
            }),
          },
        );
        if (!completeRes.ok) {
          const body = await completeRes.json().catch(() => ({}));
          setError(
            (body?.message as string) ||
              (body?.error as string) ||
              "Complete step failed.",
          );
          return;
        }
        setRemarks("");
        refreshAfterComplete(target.qrCode);
      }
    },
    [getOperator, remarks, refreshAfterComplete],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const scanned = await loadStation(qrInput);
      if (scanned) {
        await advanceStepForStation(scanned);
      }
    } catch {
      setError("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const refreshStation = useCallback(() => {
    if (station?.qrCode) {
      void loadStation(station.qrCode);
      void loadLineage(station.qrCode);
    }
  }, [loadLineage, loadStation, station?.qrCode]);

  const submitSplitLot = useCallback(
    async (params: {
      qrCode: string;
      quantity: number;
      reason: string;
    }): Promise<SplitResultPayload | null> => {
      const { qrCode, quantity, reason } = params;
      const res = await apiFetch(
        `/production-orders/lots/${encodeURIComponent(qrCode)}/split`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            releasedQuantity: quantity,
            moveReleasedToNextStep: true,
            operator: getOperator(),
            reason: reason?.trim(),
          }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          (body?.message as string) ||
            (body?.error as string) ||
            "Split lot failed.",
        );
        return null;
      }
      return (await res.json()) as SplitResultPayload;
    },
    [getOperator],
  );

  const doSplitLot = async () => {
    if (!station?.qrCode) return;
    const qty = Number(splitQuantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Split quantity must be greater than 0.");
      return;
    }
    if (qty >= Number(station.quantity)) {
      setError("Split quantity must be less than source lot quantity.");
      return;
    }
    const reason = splitReason.trim();
    if (!reason) {
      setError("กรุณากรอกหมายเหตุ (บังคับ)");
      return;
    }
    setSplitLoading(true);
    setError(null);
    try {
      const data = await submitSplitLot({
        qrCode: station.qrCode,
        quantity: qty,
        reason,
      });
      if (!data) return;
      setSplitResult(data);
      setSplitOpen(false);
      setStation(null);
      setLineage(null);
      setQuickSplitQr(null);
      setQrInput("");
      void loadMyDeptLots();
      inputRef.current?.focus();
    } catch {
      setError("Network error.");
    } finally {
      setSplitLoading(false);
    }
  };

  const doQuickSplitLot = async (lot: InProgressLot) => {
    const qty = Number(quickSplitQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Split quantity must be greater than 0.");
      return;
    }
    if (qty >= Number(lot.quantity)) {
      setError("Split quantity must be less than source lot quantity.");
      return;
    }
    const reason = quickSplitReason.trim();
    if (!reason) {
      setError("กรุณากรอกหมายเหตุ (บังคับ)");
      return;
    }
    setQuickSplitLoading(true);
    setError(null);
    try {
      const data = await submitSplitLot({
        qrCode: lot.qrCode,
        quantity: qty,
        reason,
      });
      if (!data) return;
      setSplitResult(data);
      setQuickSplitQr(null);
      setQuickSplitQty("");
      setQuickSplitReason("");
      setStation(null);
      setLineage(null);
      void loadMyDeptLots();
      inputRef.current?.focus();
    } catch {
      setError("Network error.");
    } finally {
      setQuickSplitLoading(false);
    }
  };

  const printSplitQrs = useCallback(async (payload: SplitResultPayload) => {
    if (!payload.children.length) return;
    const cards: string[] = [];
    for (const child of payload.children) {
      const qrDataUrl = await QRCode.toDataURL(child.qrCode, { width: 180, margin: 1 });
      cards.push(`
        <div class="card">
          <img src="${qrDataUrl}" alt="QR ${child.lotNo}" />
          <div class="line"><strong>${child.lotNo}</strong></div>
          <div class="line">QR: ${child.qrCode}</div>
          <div class="line">Qty: ${child.quantity}</div>
          <div class="line">Status: ${child.status}</div>
        </div>
      `);
    }
    const w = window.open("", "_blank");
    if (!w) {
      setError("กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์ QR");
      return;
    }
    w.document.write(`<!DOCTYPE html><html><head><title>Split Lot QR</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 16px; }
        .grid { display: flex; flex-wrap: wrap; gap: 16px; }
        .card { width: 250px; border: 1px solid #d4d4d8; border-radius: 8px; padding: 12px; text-align: center; }
        .line { font-size: 12px; margin-top: 6px; word-break: break-all; }
      </style></head><body>
      <h2>Split Lot Result — New QR Labels</h2>
      <div class="grid">${cards.join("")}</div>
      <script>window.onload = function(){ window.print(); }</script>
      </body></html>`);
    w.document.close();
  }, []);

  const doStart = async () => {
    if (!station?.expectedProcess || !station.qrCode) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/production-orders/lots/${encodeURIComponent(station.qrCode)}/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            processId: station.expectedProcess.processId,
            operator: getOperator(),
          }),
        },
      );
      if (res.status === 403) {
        setError("Forbidden: wrong department or missing permission.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          (body?.message as string) ||
            (body?.error as string) ||
            "Start step failed.",
        );
        return;
      }
      await loadStation(station.qrCode);
    } catch {
      setError("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const doComplete = async () => {
    if (!station?.completeProcessId || !station.qrCode) return;
    setActionLoading(true);
    setError(null);
    try {
      const safeRemarks = (remarks ?? "").trim();
      const res = await apiFetch(
        `/production-orders/lots/${encodeURIComponent(station.qrCode)}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            processId: station.completeProcessId,
            remarks: safeRemarks || undefined,
          }),
        },
      );
      if (res.status === 403) {
        setError("Forbidden: wrong department or missing permission.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          (body?.message as string) ||
            (body?.error as string) ||
            "Complete step failed.",
        );
        return;
      }
      setRemarks("");
      refreshAfterComplete(station.qrCode);
    } catch {
      setError("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const fmtCodes = (codes: string[] | null) =>
    codes?.length ? codes.join(", ") : "any dept";

  return (
    <div>
      <PageBreadcrumb pageTitle="Dept QR station" />
      <div className="space-y-6">
        <ComponentCard title="Scan lot QR — advance step (department scoped)">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
            <p>
              Session department code:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {sessionDept ?? "—"}
              </span>
              {sessionAdmin ? (
                <span className="ml-2 text-amber-700 dark:text-amber-400">
                  (ADMIN_GLOBAL — bypass dept rules)
                </span>
              ) : null}
            </p>
            <p>
              The next step must match the lot sequence. If the process has
              allowed departments, your user&apos;s department must be listed
              (e.g. WELDING or WE).
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 mb-4"
          >
            <input
              ref={inputRef}
              id="dept-step-qr-input"
              type="text"
              autoComplete="off"
              placeholder="Scan or paste lot QR, then Enter"
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              value={qrInput ?? ""}
              onChange={(e) => setQrInput(e.target.value ?? "")}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium whitespace-nowrap"
            >
              {loading ? "Loading..." : "Lookup"}
            </button>
          </form>

          {error ? (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-3 py-2 text-sm mb-4">
              {error}
            </div>
          ) : null}

          {splitResult ? (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  Split สำเร็จ: ล็อตเดิม {splitResult.sourceLot.lotNo} ถูกยกเลิกใช้งาน (retired)
                </p>
                <button
                  type="button"
                  onClick={() => void printSplitQrs(splitResult)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  พิมพ์ QR ใหม่
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {splitResult.children.map((c) => (
                  <div key={c.id} className="rounded-md border border-emerald-200 bg-white p-3 dark:border-emerald-800 dark:bg-gray-900/50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{c.lotNo}</p>
                        <p className="text-[11px] text-gray-500">
                          Order: {c.orderNoRef || splitResult.sourceLot.orderNoRef || "—"}
                        </p>
                        <p className="font-mono text-[11px] text-gray-500">{c.qrCode}</p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                          จำนวน: {Number(c.quantity).toLocaleString()} · สถานะ: {c.status}
                        </p>
                      </div>
                      <QRCodeGenerator value={c.qrCode} size={82} />
                    </div>
                    <button
                      type="button"
                      onClick={() => { setQrInput(c.qrCode); void loadStation(c.qrCode); }}
                      className="mt-2 text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      โหลดล็อตนี้ในสถานี →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* สินค้าในกระบวนการของแผนก */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                ล็อตคงค้างที่แผนก (รอเริ่ม / กำลังทำ)
                {myDeptLots.length > 0 && (
                  <span className="ml-2 normal-case font-normal text-gray-400">
                    ({myDeptLots.length} รายการ)
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => { setDeptPage(1); void loadMyDeptLots(); }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {deptLotsLoading ? "กำลังโหลด..." : "รีเฟรช"}
              </button>
            </div>
            {deptLotsLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
            ) : (() => {
              const totalPages = Math.ceil(myDeptLots.length / DEPT_PAGE_SIZE);
              const pageRows = myDeptLots.slice((deptPage - 1) * DEPT_PAGE_SIZE, deptPage * DEPT_PAGE_SIZE);
              return (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                          <th className="py-2 pr-2 w-6"></th>
                          <th className="text-left py-2 pr-3 font-medium">Lot No.</th>
                          <th className="text-left py-2 pr-3 font-medium">Order</th>
                          <th className="text-right py-2 pr-3 font-medium">จำนวน</th>
                          <th className="text-left py-2 pr-3 font-medium">สินค้า</th>
                          <th className="text-left py-2 pr-3 font-medium">สถานะ</th>
                          <th className="text-left py-2 pr-3 font-medium">ขั้นตอนปัจจุบัน</th>
                          <th className="text-center py-2 font-medium">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.length === 0 ? (
                          <TableEmptyRow
                            colSpan={8}
                            message="ไม่มีล็อตรอเริ่มหรือกำลังทำที่ขั้นตอนของแผนกนี้ (ล็อตต้องอยู่ขั้นปัจจุบันที่แผนก WELDING/WE รับงานได้)"
                          />
                        ) : (
                          pageRows.map((lot, i) => (
                          <React.Fragment key={`${lot.qrCode}-${lot.lotNo}-${lot.orderNo}-${lot.status ?? 'NA'}-${i}`}>
                            <tr
                              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer align-top"
                            >
                              <td className="py-2 pr-2">
                                <button
                                  type="button"
                                  onClick={() => void toggleTracking(lot.qrCode)}
                                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
                                >
                                  {expandedQr === lot.qrCode ? '▼' : '▶'}
                                </button>
                              </td>
                              <td className="py-2 pr-3 font-medium whitespace-nowrap" onClick={() => { setQrInput(lot.qrCode); void loadStation(lot.qrCode); }}>{lot.lotNo}</td>
                              <td className="py-2 pr-3 text-gray-600 dark:text-gray-400 whitespace-nowrap" onClick={() => { setQrInput(lot.qrCode); void loadStation(lot.qrCode); }}>{lot.orderNo}</td>
                              <td className="py-2 pr-3 text-right whitespace-nowrap" onClick={() => { setQrInput(lot.qrCode); void loadStation(lot.qrCode); }}>
                                {Number(lot.quantity ?? 0).toLocaleString()}
                              </td>
                              <td className="py-2 pr-3" onClick={() => { setQrInput(lot.qrCode); void loadStation(lot.qrCode); }}>
                                <div className="font-medium">{lot.productCode}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{lot.productName}</div>
                              </td>
                              <td className="py-2 pr-3 whitespace-nowrap" onClick={() => { setQrInput(lot.qrCode); void loadStation(lot.qrCode); }}>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  lot.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                  lot.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                  lot.status === 'PENDING' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200' :
                                  lot.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {lot.status ?? '—'}
                                </span>
                              </td>
                              <td className="py-2 pr-3 whitespace-nowrap" onClick={() => { setQrInput(lot.qrCode); void loadStation(lot.qrCode); }}>
                                <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
                                  {lot.currentProcessCode} — {lot.currentProcessName}
                                </span>
                              </td>
                              <td className="py-2 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  disabled={quickSplitLoading || lot.status === "COMPLETED"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (quickSplitQr === lot.qrCode) {
                                      setQuickSplitQr(null);
                                      return;
                                    }
                                    setQuickSplitQr(lot.qrCode);
                                    setQuickSplitQty("");
                                    setQuickSplitReason("");
                                  }}
                                  className="rounded-md border border-violet-300 px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/20"
                                >
                                  {quickSplitQr === lot.qrCode ? "ปิด Split" : "Split"}
                                </button>
                              </td>
                            </tr>
                            {quickSplitQr === lot.qrCode ? (
                              <tr className="bg-violet-50/60 dark:bg-violet-900/10">
                                <td colSpan={8} className="px-4 py-3">
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                                    <div>
                                      <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                                        จำนวนที่ปล่อยไปขั้นถัดไป <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        step="0.0001"
                                        max={Math.max(Number(lot.quantity) - 0.0001, 0)}
                                        value={quickSplitQty}
                                        onChange={(e) => setQuickSplitQty(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                        disabled={quickSplitLoading}
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                                        หมายเหตุ <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={quickSplitReason}
                                        onChange={(e) => setQuickSplitReason(e.target.value)}
                                        placeholder="ระบุเหตุผลการ split (บังคับ)"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                        disabled={quickSplitLoading}
                                      />
                                    </div>
                                    <div className="flex items-end">
                                      <button
                                        type="button"
                                        onClick={() => void doQuickSplitLot(lot)}
                                        disabled={quickSplitLoading}
                                        className="w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                                      >
                                        {quickSplitLoading ? "กำลัง split..." : "ยืนยัน Split"}
                                      </button>
                                    </div>
                                  </div>
                                  <p className="mt-2 text-[11px] text-violet-800/90 dark:text-violet-200/90">
                                    {lot.status === "PENDING"
                                      ? "รอเริ่ม: จำนวนที่กรอกใช้ QR เดิม — กำลังผลิตที่ขั้นถัดไป · ส่วนที่เหลือได้ QR ใหม่"
                                      : "จำนวนที่กรอกจะปล่อยไปขั้นถัดไปทันที — ส่วนที่เหลือได้ QR ใหม่"}
                                  </p>
                                </td>
                              </tr>
                            ) : null}
                            {expandedQr === lot.qrCode && (
                              <tr className="bg-gray-50 dark:bg-gray-800/50">
                                <td colSpan={8} className="px-4 py-2">
                                  {trackingLoadingQr === lot.qrCode ? (
                                    <p className="text-xs text-gray-400">กำลังโหลด...</p>
                                  ) : (
                                    <div className="space-y-3">
                                      <div>
                                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                          Tracking
                                        </p>
                                        {(trackingMap[lot.qrCode] ?? []).length === 0 ? (
                                          <p className="text-xs text-gray-400">ไม่มีประวัติขั้นตอน</p>
                                        ) : (
                                          <div className="space-y-2">
                                            {(trackingMap[lot.qrCode] ?? []).map((t, i) => (
                                              <div
                                                key={[
                                                  t.status ?? 'NA',
                                                  t.processCode ?? 'NA',
                                                  t.startTime ?? 'NA',
                                                  t.endTime ?? 'NA',
                                                  t.operator ?? 'NA',
                                                  String(i),
                                                ].join('|')}
                                                className="rounded-md border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/30 px-2.5 py-2"
                                              >
                                                <div className="text-xs flex flex-wrap items-center gap-x-2 gap-y-1">
                                                  <span className={`inline-block rounded px-1.5 py-0.5 font-medium ${
                                                    t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                    t.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                    t.status === 'MATERIAL_ISSUED' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                    t.status === 'PLAN_CONFIRMED' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' :
                                                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                  }`}>{t.status}</span>

                                                  <span className="font-medium text-gray-800 dark:text-gray-200">
                                                    {t.processCode ?? '—'}
                                                    {t.processName ? ` — ${t.processName}` : ''}
                                                  </span>

                                                  {t.operator ? (
                                                    <span className="text-gray-700 dark:text-gray-300">
                                                      · ผู้ทำ:{" "}
                                                      <span className="font-mono font-medium">
                                                        {resolveOperatorLabel(t.operator, sessionUser)}
                                                      </span>
                                                    </span>
                                                  ) : null}
                                                </div>

                                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                                                  {t.startTime ? (
                                                    <span>เริ่ม: {new Date(t.startTime).toLocaleString('th-TH')}</span>
                                                  ) : null}
                                                  {t.endTime ? (
                                                    <span>จบ: {new Date(t.endTime).toLocaleString('th-TH')}</span>
                                                  ) : null}
                                                </div>

                                                {t.remarks ? (
                                                  <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                                                    หมายเหตุ: <span className="text-gray-600 dark:text-gray-300">{t.remarks}</span>
                                                  </div>
                                                ) : null}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      <div>
                                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                          Lineage
                                        </p>
                                        {!lineageMap[lot.qrCode]?.lot ? (
                                          <p className="text-xs text-gray-400">ไม่มีข้อมูล lineage</p>
                                        ) : (
                                          <div className="space-y-1 text-xs">
                                            {lineageMap[lot.qrCode]?.parent ? (
                                              <div className="rounded border border-amber-200 bg-amber-50 px-2 py-1 dark:border-amber-800 dark:bg-amber-900/20">
                                                Parent:{" "}
                                                <button
                                                  type="button"
                                                  onClick={() => { setQrInput(lineageMap[lot.qrCode]!.parent!.qrCode); void loadStation(lineageMap[lot.qrCode]!.parent!.qrCode); }}
                                                  className="font-mono text-blue-700 hover:underline dark:text-blue-300"
                                                >
                                                  {lineageMap[lot.qrCode]!.parent!.lotNo}
                                                </button>
                                              </div>
                                            ) : null}
                                            <div className="rounded border border-blue-200 bg-blue-50 px-2 py-1 dark:border-blue-800 dark:bg-blue-900/20">
                                              Current: <span className="font-mono">{lineageMap[lot.qrCode]!.lot?.lotNo}</span>
                                            </div>
                                            {(lineageMap[lot.qrCode]?.children ?? []).map((c) => (
                                              <div
                                                key={c.id}
                                                className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 dark:border-emerald-800 dark:bg-emerald-900/20"
                                              >
                                                Child:{" "}
                                                <button
                                                  type="button"
                                                  onClick={() => { setQrInput(c.qrCode); void loadStation(c.qrCode); }}
                                                  className="font-mono text-blue-700 hover:underline dark:text-blue-300"
                                                >
                                                  {c.lotNo}
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>หน้า {deptPage} / {totalPages}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={deptPage === 1}
                          onClick={() => setDeptPage((p) => p - 1)}
                          className="rounded px-2 py-1 border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          ‹ ก่อนหน้า
                        </button>
                        <button
                          type="button"
                          disabled={deptPage === totalPages}
                          onClick={() => setDeptPage((p) => p + 1)}
                          className="rounded px-2 py-1 border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          ถัดไป ›
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {station ? (
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              {station.stepSummaryTh ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-3 dark:border-blue-800 dark:bg-blue-950/30">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    Current step (Thai summary from server)
                  </p>
                  <p className="mt-1 text-base font-semibold text-blue-950 dark:text-blue-50">
                    {station.stepSummaryTh}
                  </p>
                  {station.currentStepPhase ? (
                    <p className="mt-1 text-xs text-blue-800/80 dark:text-blue-200/80">
                      Phase: {station.currentStepPhase}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {station.departmentAlertTh ? (
                <div className="rounded-lg border-2 border-amber-400 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100">
                  {station.departmentAlertTh}
                </div>
              ) : null}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Lot</span>
                  <div className="font-medium">{station.lotNo}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Order
                  </span>
                  <div className="font-medium">{station.orderNo}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Product
                  </span>
                  <div className="font-medium">
                    {station.productCode} — {station.productName}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Lot status
                  </span>
                  <div className="font-medium">{station.status}</div>
                </div>
              </div>

              {station.status !== "COMPLETED" ? (
                <div className="rounded-lg border border-violet-200 bg-violet-50/70 p-3 dark:border-violet-800 dark:bg-violet-950/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                      Split lot
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (splitOpen) {
                          setSplitOpen(false);
                          setSplitReason("");
                        } else {
                          setSplitQuantity("");
                          setSplitReason("");
                          setSplitOpen(true);
                        }
                      }}
                      className="rounded-md border border-violet-400 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-600 dark:text-violet-300 dark:hover:bg-violet-900/30"
                    >
                      {splitOpen ? "ปิด Split" : "Split"}
                    </button>
                  </div>
                  {splitOpen ? (
                    <>
                  <p className="mt-2 text-xs text-violet-800/90 dark:text-violet-200/90">
                    {station.status === "PENDING"
                      ? "รอเริ่ม: จำนวนที่กรอกใช้ QR เดิม — กำลังผลิตที่ขั้นถัดไป · ส่วนที่เหลือได้ QR ใหม่"
                      : "กำลังผลิต: QR เดิมจะ retired — จำนวนที่ปล่อยไปขั้นถัดไปทันที (QR ใหม่)"}
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                        จำนวนที่ปล่อยไปขั้นถัดไป <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.0001"
                        max={Math.max(Number(station.quantity) - 0.0001, 0)}
                        value={splitQuantity}
                        onChange={(e) => setSplitQuantity(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                        disabled={splitLoading || actionLoading}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                        หมายเหตุ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={splitReason}
                        onChange={(e) => setSplitReason(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                        placeholder="ระบุเหตุผลการ split (บังคับ)"
                        disabled={splitLoading || actionLoading}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => void doSplitLot()}
                      disabled={splitLoading || actionLoading}
                      className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      {splitLoading ? "กำลัง split..." : "ยืนยัน Split"}
                    </button>
                  </div>
                    </>
                  ) : null}
                </div>
              ) : null}

              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Route
                </div>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-800 dark:text-gray-200">
                  {station.route.map((r, i) => (
                    <li key={`${r.processId}-${i}`}>
                      {r.processCode} — {r.processName}
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        [{fmtCodes(r.allowedDepartmentCodes)}]
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/40">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Lineage</p>
                  {lineageLoading ? (
                    <span className="text-xs text-gray-400">กำลังโหลด...</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void loadLineage(station.qrCode)}
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      รีเฟรช lineage
                    </button>
                  )}
                </div>
                {!lineage?.lot ? (
                  <p className="mt-2 text-xs text-gray-400">ไม่มีข้อมูล lineage</p>
                ) : (
                  <div className="mt-2 space-y-2 text-xs">
                    {lineage.parent ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 dark:border-amber-800 dark:bg-amber-900/20">
                        <span className="font-medium text-amber-800 dark:text-amber-200">Parent:</span>{" "}
                        <button
                          type="button"
                          onClick={() => { setQrInput(lineage.parent!.qrCode); void loadStation(lineage.parent!.qrCode); }}
                          className="font-mono text-blue-700 hover:underline dark:text-blue-300"
                        >
                          {lineage.parent.lotNo}
                        </button>{" "}
                        · Qty {Number(lineage.parent.quantity).toLocaleString()} · {lineage.parent.status}
                      </div>
                    ) : null}
                    <div className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5 dark:border-blue-800 dark:bg-blue-900/20">
                      <span className="font-medium text-blue-800 dark:text-blue-200">Current:</span>{" "}
                      <span className="font-mono">{lineage.lot.lotNo}</span> · Qty{" "}
                      {Number(lineage.lot.quantity).toLocaleString()} · {lineage.lot.status}
                      {lineage.lot.orderNoRef ? (
                        <span className="ml-2 text-gray-600 dark:text-gray-300">
                          (Order: {lineage.lot.orderNoRef})
                        </span>
                      ) : null}
                    </div>
                    {(lineage.children ?? []).length > 0 ? (
                      <div className="space-y-1">
                        {(lineage.children ?? []).map((c) => (
                          <div key={c.id} className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 dark:border-emerald-800 dark:bg-emerald-900/20">
                            <span className="font-medium text-emerald-800 dark:text-emerald-200">Child:</span>{" "}
                            <button
                              type="button"
                              onClick={() => { setQrInput(c.qrCode); void loadStation(c.qrCode); }}
                              className="font-mono text-blue-700 hover:underline dark:text-blue-300"
                            >
                              {c.lotNo}
                            </button>{" "}
                            · Qty {Number(c.quantity).toLocaleString()} · {c.status}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">ยังไม่มี child lots</p>
                    )}
                  </div>
                )}
              </div>

              {station.inProgress ? (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm">
                  <div className="font-medium text-amber-900 dark:text-amber-100">
                    In progress: {station.inProgress.processCode} —{" "}
                    {station.inProgress.processName}
                  </div>
                  <div className="text-amber-800/90 dark:text-amber-200/90 text-xs mt-1">
                    Started:{" "}
                    {new Date(station.inProgress.startTime).toLocaleString()}
                  </div>
                </div>
              ) : station.expectedProcess && station.nextAction === "start" ? (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-sm">
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    Next: {station.expectedProcess.processCode} —{" "}
                    {station.expectedProcess.processName}
                  </div>
                  <div className="text-blue-800/90 dark:text-blue-200/90 text-xs mt-1">
                    Allowed depts:{" "}
                    {fmtCodes(station.expectedProcess.allowedDepartmentCodes)}
                  </div>
                </div>
              ) : null}

              {station.denyReason && !station.departmentAlertTh ? (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                  {station.denyReason}
                </div>
              ) : null}

              {station.nextAction === "complete" ? (
                <div className="space-y-2">
                  <label className="block text-xs text-gray-500 dark:text-gray-400">
                    Remarks (optional)
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                    rows={2}
                    value={remarks ?? ""}
                    onChange={(e) => setRemarks(e.target.value ?? "")}
                    disabled={actionLoading}
                  />
                  <button
                    type="button"
                    disabled={!station.canComplete || actionLoading}
                    onClick={() => void doComplete()}
                    className="rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium"
                  >
                    {actionLoading ? "Saving..." : "Complete this step"}
                  </button>
                </div>
              ) : null}

              {station.nextAction === "start" &&
              station.status !== "COMPLETED" ? (
                <button
                  type="button"
                  disabled={!station.canStart || actionLoading}
                  onClick={() => void doStart()}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium"
                >
                  {actionLoading ? "Saving..." : "Start next step"}
                </button>
              ) : null}

              {station.nextAction === "none" ||
              station.status === "COMPLETED" ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lot is finished or there is no further action.
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => void refreshStation()}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Refresh status
              </button>
            </div>
          ) : null}
        </ComponentCard>
      </div>
    </div>
  );
}
