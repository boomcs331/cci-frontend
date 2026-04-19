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

export default function ProductionStepScanPage() {
  const [qrInput, setQrInput] = useState("");
  const [station, setStation] = useState<LotStationPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [autoAdvanceOnScan, setAutoAdvanceOnScan] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [sessionDept, setSessionDept] = useState<string | null>(null);
  const [sessionAdmin, setSessionAdmin] = useState(false);
  const getOperator = useCallback((): string => {
    const session = getSession();
    const uid = session?.user?.id;
    return uid ? String(uid) : "scanner";
  }, []);

  useEffect(() => {
    setSessionDept(getUserDepartmentCode());
    setSessionAdmin(isAdmin());
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, []);

  const loadStation = useCallback(async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) {
      setError("กรอกหรือสแกน QR ล็อตผลิตก่อน");
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
        setError("ไม่พบล็อตผลิตจาก QR นี้");
        return null;
      }
      if (res.status === 403) {
        setError("ไม่มีสิทธิ์อ่านสถานีงาน (production_orders.read)");
        return null;
      }
      if (!res.ok) {
        setError("โหลดสถานะสถานีงานไม่สำเร็จ");
        return null;
      }
      const data = (await res.json()) as LotStationPayload;
      setStation(data);
      setQrInput("");
      return data;
    } catch {
      setError("การเชื่อมต่อล้มเหลว");
      return null;
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, []);

  const advanceStepForStation = useCallback(
    async (target: LotStationPayload) => {
      if (!target.qrCode || target.status === "COMPLETED") return;

      // Case 1: already in progress -> complete current step
      if (target.nextAction === "complete" && target.completeProcessId) {
        const completeRes = await apiFetch(
          `/production-orders/lots/${encodeURIComponent(target.qrCode)}/complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              processId: target.completeProcessId,
              remarks: remarks.trim() || "advance-step",
            }),
          },
        );
        if (!completeRes.ok) {
          const body = await completeRes.json().catch(() => ({}));
          setError(
            (body?.message as string) ||
              (body?.error as string) ||
              "เลื่อนไปขั้นตอนถัดไปไม่สำเร็จ",
          );
          return;
        }
        setRemarks("");
        await loadStation(target.qrCode);
        return;
      }

      // Case 2: waiting start -> start then complete immediately
      if (target.nextAction === "start" && target.expectedProcess) {
        const pid = target.expectedProcess.processId;

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
              "ไม่สามารถเริ่มขั้นตอนเพื่อเลื่อนงานได้",
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
              remarks: remarks.trim() || "advance-step",
            }),
          },
        );
        if (!completeRes.ok) {
          const body = await completeRes.json().catch(() => ({}));
          setError(
            (body?.message as string) ||
              (body?.error as string) ||
              "เริ่มแล้วแต่ปิดขั้นตอนไม่สำเร็จ",
          );
          return;
        }

        setRemarks("");
        await loadStation(target.qrCode);
      }
    },
    [getOperator, loadStation, remarks],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scanned = await loadStation(qrInput);
    if (!autoAdvanceOnScan || !scanned || scanned.status === "COMPLETED") return;
    setActionLoading(true);
    setError(null);
    try {
      await advanceStepForStation(scanned);
    } catch {
      setError("การเชื่อมต่อล้มเหลว");
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
        setError("ไม่มีสิทธิ์เริ่มขั้นตอนนี้ หรือแผนกไม่ตรงกับที่กำหนด");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          (body?.message as string) ||
            (body?.error as string) ||
            "เริ่มขั้นตอนไม่สำเร็จ",
        );
        return;
      }
      await loadStation(station.qrCode);
    } catch {
      setError("การเชื่อมต่อล้มเหลว");
    } finally {
      setActionLoading(false);
    }
  };

  const doComplete = async () => {
    if (!station?.completeProcessId || !station.qrCode) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/production-orders/lots/${encodeURIComponent(station.qrCode)}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            processId: station.completeProcessId,
            remarks: remarks.trim() || undefined,
          }),
        },
      );
      if (res.status === 403) {
        setError("ไม่มีสิทธิ์ปิดขั้นตอนนี้ หรือแผนกไม่ตรงกับที่กำหนด");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          (body?.message as string) ||
            (body?.error as string) ||
            "ปิดขั้นตอนไม่สำเร็จ",
        );
        return;
      }
      setRemarks("");
      await loadStation(station.qrCode);
    } catch {
      setError("การเชื่อมต่อล้มเหลว");
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Advance one step with a single action:
   * - WAITING_START => start + complete current expected step (moves to next)
   * - IN_PROGRESS   => complete current in-progress step (moves to next)
   */
  const doAdvanceStep = async () => {
    if (!station?.qrCode || station.status === "COMPLETED") return;
    setActionLoading(true);
    setError(null);
    try {
      await advanceStepForStation(station);
    } catch {
      setError("การเชื่อมต่อล้มเหลว");
    } finally {
      setActionLoading(false);
    }
  };

  const fmtCodes = (codes: string[] | null) =>
    codes?.length ? codes.join(", ") : "ทุกแผนก";

  return (
    <div>
      <PageBreadcrumb pageTitle="ติดตาม/อัปเดตขั้นตอนผลิต (ลงฐานข้อมูล)" />
      <div className="space-y-6">
        <ComponentCard title="สแกน QR ล็อตผลิตเพื่ออัปเดตขั้นตอน (บันทึก DB)">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
            <p>
              แผนกจาก session:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {sessionDept ?? "—"}
              </span>
              {sessionAdmin ? (
                <span className="ml-2 text-amber-700 dark:text-amber-400">
                  (ADMIN_GLOBAL ข้ามเงื่อนไขแผนกได้)
                </span>
              ) : null}
            </p>
            <p>หลังจ่ายวัตถุดิบแล้ว ระบบจะสร้าง QR product และตั้งสถานะล็อตไว้ที่ขั้นตอนแรกโดยอัตโนมัติ</p>
            <p>เมื่อสแกนล็อตแล้ว ระบบสามารถเลื่อนไปขั้นตอนถัดไปอัตโนมัติ และบันทึกลง `production_lot_tracking`</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 mb-4"
          >
            <input
              ref={inputRef}
              id="pc-step-qr-input"
              type="text"
              autoComplete="off"
              placeholder="สแกนหรือวางค่า QR ล็อตผลิต แล้วกด Enter"
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium whitespace-nowrap"
            >
              {loading ? "กำลังโหลด..." : "สแกน / ตรวจสอบ"}
            </button>
          </form>

          <label className="mb-4 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoAdvanceOnScan}
              onChange={(e) => setAutoAdvanceOnScan(e.target.checked)}
              className="h-4 w-4"
            />
            สแกนแล้วเลื่อนไปขั้นตอนถัดไปอัตโนมัติ
          </label>

          {error ? (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-3 py-2 text-sm mb-4">
              {error}
            </div>
          ) : null}

          {station ? (
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              {station.stepSummaryTh ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-3 dark:border-blue-800 dark:bg-blue-950/30">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    สรุปขั้นตอนปัจจุบัน
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
                    {station.productCode} - {station.productName}
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
                  เส้นทางขั้นตอนผลิต
                </div>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-800 dark:text-gray-200">
                  {station.route.map((r) => (
                    <li key={r.processId}>
                      {r.processCode} - {r.processName}
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
                    กำลังดำเนินการ: {station.inProgress.processCode} -{" "}
                    {station.inProgress.processName}
                  </div>
                  <div className="text-amber-800/90 dark:text-amber-200/90 text-xs mt-1">
                    เริ่มเมื่อ:{" "}
                    {new Date(station.inProgress.startTime).toLocaleString()}
                  </div>
                </div>
              ) : station.expectedProcess && station.nextAction === "start" ? (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-sm">
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    ขั้นถัดไป: {station.expectedProcess.processCode} -{" "}
                    {station.expectedProcess.processName}
                  </div>
                  <div className="text-blue-800/90 dark:text-blue-200/90 text-xs mt-1">
                    แผนกที่ทำได้:{" "}
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
                    หมายเหตุ (ถ้ามี)
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    disabled={actionLoading}
                  />
                  <button
                    type="button"
                    disabled={!station.canComplete || actionLoading}
                    onClick={() => void doComplete()}
                    className="rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium"
                  >
                    {actionLoading ? "กำลังบันทึก..." : "ปิดขั้นตอนนี้"}
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
                  {actionLoading ? "กำลังบันทึก..." : "เริ่มขั้นตอนถัดไป"}
                </button>
              ) : null}

              {station.nextAction === "none" ||
              station.status === "COMPLETED" ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ล็อตนี้เสร็จแล้ว หรือไม่มี action ต่อ
                </p>
              ) : null}

              {station.status !== "COMPLETED" && (
                <button
                  type="button"
                  disabled={
                    actionLoading ||
                    !(
                      (station.nextAction === "start" && station.canStart) ||
                      (station.nextAction === "complete" && station.canComplete)
                    )
                  }
                  onClick={() => void doAdvanceStep()}
                  className="rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium"
                >
                  {actionLoading ? "กำลังบันทึก..." : "Advance step (ไปขั้นตอนถัดไป)"}
                </button>
              )}

              <button
                type="button"
                onClick={() => void refreshStation()}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                รีเฟรชสถานะ
              </button>
            </div>
          ) : null}
        </ComponentCard>
      </div>
    </div>
  );
}
