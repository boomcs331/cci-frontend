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

export default function DeptStepScanPage() {
  const [qrInput, setQrInput] = useState("");
  const [station, setStation] = useState<LotStationPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  /** Read session only after mount so SSR + first client paint match (avoids hydration mismatch). */
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
    const t = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(t);
  }, []);

  const loadStation = useCallback(async (rawCode: string) => {
    const code = rawCode.trim();
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

  const advanceStepForStation = useCallback(
    async (target: LotStationPayload) => {
      if (!target.qrCode || target.status === "COMPLETED") return;

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
              "Complete step failed.",
          );
          return;
        }
        setRemarks("");
        await loadStation(target.qrCode);
        return;
      }

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
              remarks: remarks.trim() || "advance-step",
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
        await loadStation(target.qrCode);
      }
    },
    [getOperator, loadStation, remarks],
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
      await loadStation(station.qrCode);
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
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
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
                  {station.route.map((r) => (
                    <li key={r.processId}>
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
