"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { apiFetch } from "@/utils/api";
import { getSession, getUserDepartmentCode, isAdmin } from "@/utils/session";

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
  const DEPT_PAGE_SIZE = 10;
  const getOperator = useCallback((): string => {
    const session = getSession();
    const uid = session?.user?.id;
    return uid ? String(uid) : "scanner";
  }, []);

  useEffect(() => {
    setSessionDept(getUserDepartmentCode());
    setSessionAdmin(isAdmin());
  }, []);

  const loadMyDeptLots = useCallback(async () => {
    setDeptLotsLoading(true);
    try {
      const res = await apiFetch("/production-orders/in-progress/my-dept");
      if (res.ok) setMyDeptLots((await res.json()) as InProgressLot[]);
    } finally {
      setDeptLotsLoading(false);
    }
  }, []);

  const toggleTracking = useCallback(async (qrCode: string) => {
    if (expandedQr === qrCode) { setExpandedQr(null); return; }
    setExpandedQr(qrCode);
    if (trackingMap[qrCode]) return;
    setTrackingLoadingQr(qrCode);
    try {
      const res = await apiFetch(`/production-orders/lots/${encodeURIComponent(qrCode)}/tracking`);
      if (res.ok) {
        const data = (await res.json()) as TrackingRow[];
        setTrackingMap((prev) => ({ ...prev, [qrCode]: data }));
      }
    } finally {
      setTrackingLoadingQr(null);
    }
  }, [expandedQr, trackingMap]);

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
        setError("Could not load station state.");
        return null;
      }
      const data = (await res.json()) as LotStationPayload;
      setStation(data);
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

  const refreshAfterComplete = useCallback((qrCode: string) => {
    void loadMyDeptLots();
    setTrackingMap((prev) => { const n = { ...prev }; delete n[qrCode]; return n; });
    // ไม่ clear station เพื่อให้สแกนต่อไปได้ทันทีเลย
    setStation(null);
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
    if (station?.qrCode) void loadStation(station.qrCode);
  }, [loadStation, station?.qrCode]);

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

          {/* สินค้าในกระบวนการของแผนก */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                สินค้าในกระบวนการ (ทั้งหมด)
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
            {myDeptLots.length === 0 && !deptLotsLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">ไม่มีสินค้าในกระบวนการ</p>
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
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((lot, i) => (
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
                            </tr>
                            {expandedQr === lot.qrCode && (
                              <tr className="bg-gray-50 dark:bg-gray-800/50">
                                <td colSpan={7} className="px-4 py-2">
                                  {trackingLoadingQr === lot.qrCode ? (
                                    <p className="text-xs text-gray-400">กำลังโหลด...</p>
                                  ) : (trackingMap[lot.qrCode] ?? []).length === 0 ? (
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
                                              <span className="text-gray-500 dark:text-gray-400">· {t.operator}</span>
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
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
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
