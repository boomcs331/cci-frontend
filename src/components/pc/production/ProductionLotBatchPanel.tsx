"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import QRCodeGenerator from "@/components/common/QRCodeGenerator";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import { apiFetch } from "@/utils/api";
import {
  type GenerateProductQrOrdersBody,
  generateProductQrOrders,
  resolveProductionOrderForPlanItem,
} from "@/services/productionPlanQrService";
import {
  listLotsForPlanItem,
  syncPlanItemLotsFromServer,
  upsertLotRecord,
  type ProductionLotRecord,
} from "@/utils/productionLotTracking";
import QRCode from "qrcode";

interface Props {
  planId: number;
  planCode: string;
  itemIndex: number;
  /** จาก GET .../details ต่อรายการในแผน — ใช้เรียก generate-product-qr-orders */
  planItemId?: number;
  planStatus: string;
  productId: number;
  productName: string;
  totalQty: number;
  unit: string;
  /** ลำดับชื่อขั้นตอนผลิตจากสินค้า (GET production-steps) */
  processStepLabels?: string[];
}

type LotStatusPayload = {
  qrCode: string;
  status: string;
  currentStepPhase?: "IN_PROGRESS" | "WAITING_START" | "COMPLETED";
  stepSummaryTh?: string;
  currentProcessCode?: string | null;
  currentProcess?: string | null;
};

export default function ProductionLotBatchPanel({
  planId,
  planCode,
  itemIndex,
  planItemId,
  planStatus,
  productId,
  productName,
  totalQty,
  unit,
  processStepLabels,
}: Props) {
  const [packSizeInput, setPackSizeInput] = useState("100");
  const [lots, setLots] = useState<ProductionLotRecord[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [statusByQr, setStatusByQr] = useState<Record<string, LotStatusPayload>>(
    {},
  );
  const [statusLoading, setStatusLoading] = useState(false);

  const refresh = useCallback(() => {
    setLots(listLotsForPlanItem(planId, itemIndex));
  }, [planId, itemIndex]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (lots.length === 0) {
      setStatusByQr({});
      setStatusLoading(false);
      return;
    }

    let cancelled = false;
    setStatusLoading(true);

    (async () => {
      const entries = await Promise.all(
        lots.map(async (r) => {
          try {
            const res = await apiFetch(
              `/production-orders/lots/${encodeURIComponent(r.qrPayload)}/status`,
            );
            if (!res.ok) return null;
            const data = (await res.json()) as LotStatusPayload;
            return [r.qrPayload, data] as const;
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;
      const next: Record<string, LotStatusPayload> = {};
      for (const item of entries) {
        if (!item) continue;
        next[item[0]] = item[1];
      }
      setStatusByQr(next);
      setStatusLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [lots]);

  // ตาม requirement: ให้แสดงการติดตามเริ่มที่ step ลำดับที่ 1 เสมอ
  // (รีเซ็ตล็อตที่มีอยู่ให้กลับไป stepIndex=0 และผูกชื่อขั้นตอนของสินค้า)
  useEffect(() => {
    const stored = listLotsForPlanItem(planId, itemIndex);
    if (stored.length === 0) return;

    const hasAnyNotFirst = stored.some((r) => r.stepIndex !== 0);
    const shouldAttachLabels =
      processStepLabels && processStepLabels.length > 0
        ? stored.some((r) => (r.processStepLabels?.length ?? 0) === 0)
        : false;

    if (!hasAnyNotFirst && !shouldAttachLabels) return;

    const labels =
      processStepLabels && processStepLabels.length > 0
        ? [...processStepLabels]
        : undefined;

    for (const r of stored) {
      upsertLotRecord({
        ...r,
        stepIndex: 0,
        updatedAt: new Date().toISOString(),
        ...(labels ? { processStepLabels: labels } : {}),
      });
    }
    refresh();
  }, [planId, itemIndex, processStepLabels, refresh]);

  const packSize = parseFloat(packSizeInput.replace(",", "."));
  const previewCount =
    packSize > 0 && totalQty > 0 ? Math.ceil(totalQty / packSize) : 0;

  const handleGenerate = async () => {
    setMsg(null);
    if (!(packSize > 0)) {
      setMsg("กรุณาระบุจำนวนต่อล็อต (บรรจุ) มากกว่า 0");
      return;
    }

    const labelsOpt =
      processStepLabels && processStepLabels.length > 0
        ? [...processStepLabels]
        : undefined;

    const canTryServerApi = planStatus === "reserved" || planStatus === "confirmed";

    if (!canTryServerApi) {
      setMsg("ต้องอยู่สถานะจองหรือยืนยันก่อน จึงสร้าง QR product เพื่อติดตามใน DB ได้");
      return;
    }

    setSyncing(true);
    try {
      const body: GenerateProductQrOrdersBody = {
        defaultLotSize: packSize,
      };
      if (planItemId != null && Number.isFinite(Number(planItemId))) {
        body.planItemIds = [Number(planItemId)];
      }
      const data = await generateProductQrOrders(planId, body);
      const order = resolveProductionOrderForPlanItem(
        data,
        { planItemId, productId, productName },
        itemIndex,
        data.orders,
      );
      if (!order?.lots?.length) {
        setMsg("ไม่ได้รับรายการล็อตจากเซิร์ฟเวอร์ — ลองรีเฟรชหน้าแล้วกดใหม่");
        return;
      }
      syncPlanItemLotsFromServer({
        planId,
        planCode,
        itemIndex,
        productId,
        productName,
        unit,
        lots: order.lots.map((l) => ({
          qrCode: l.qrCode,
          quantity: l.quantity,
          sequenceNo: l.sequenceNo,
          lotNo: l.lotNo,
            orderLotLabel: l.orderLotLabel ?? undefined,
        })),
        processStepLabels: labelsOpt,
        productionOrderId: order.id,
      });
      setMsg(
        `สร้าง ${order.lots.length} QR product และบันทึกใน production_lots แล้ว`,
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "สร้างล็อตไม่สำเร็จ";
      setMsg(`${message} — ไม่สร้าง fallback ในเครื่อง เพื่อให้การติดตามอิงฐานข้อมูลเท่านั้น`);
    } finally {
      setSyncing(false);
    }
    refresh();
  };

  const handlePrintAll = async () => {
    if (lots.length === 0) return;
    const cells: string[] = [];
    for (const r of lots) {
      const dataUrl = await QRCode.toDataURL(r.qrPayload, { width: 140, margin: 1 });
      cells.push(`
        <div class="cell">
          <img src="${dataUrl}" alt="" />
          <div class="meta">${r.planCode} · ${r.productName}</div>
          <div class="meta">ล็อต ${r.lotIndex + 1}/${lots.length} · ${r.quantity} ${r.unit}</div>
          <div class="code">${r.qrPayload}</div>
        </div>
      `);
    }
    const w = window.open("", "_blank");
    if (!w) {
      alert("กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์");
      return;
    }
    w.document.write(`<!DOCTYPE html><html><head><title>QR ล็อตผลิต</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 16px; }
        .grid { display: flex; flex-wrap: wrap; gap: 16px; justify-content: flex-start; }
        .cell { border: 1px solid #ccc; padding: 12px; width: 200px; text-align: center; page-break-inside: avoid; }
        .meta { font-size: 11px; margin-top: 6px; color: #333; }
        .code { font-size: 9px; font-family: monospace; margin-top: 4px; word-break: break-all; color: #666; }
      </style></head><body>
      <h2 style="font-size:16px;margin-bottom:12px;">${planCode} — ${productName}</h2>
      <div class="grid">${cells.join("")}</div>
      <script>window.onload = function(){ window.print(); }</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <div className="mt-6 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
      <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
        ล็อตผลิต / QR ติดตามขั้นตอน
      </h4>
      <p className="text-xs text-indigo-800/80 dark:text-indigo-200/80 mb-3">
        ตัวอย่าง: ผลิต {totalQty.toLocaleString()} {unit} บรรจุล็อตละ 100 → ได้{" "}
        {Math.ceil(totalQty / 100)} QR — ลำดับขั้นตอนตามที่กำหนดใน{" "}
        <span className="font-medium">ลำดับขั้นตอนผลิตของสินค้า</span>
        {processStepLabels && processStepLabels.length > 0
          ? ` (${processStepLabels.length} ขั้น)`
          : " (ค่าเริ่มต้นระบบหากยังไม่กำหนดในมาสเตอร์)"}
        <span className="block mt-1 text-amber-800/90 dark:text-amber-200/90">
          หมายเหตุ: เมื่อแผนอยู่สถานะจอง/ยืนยัน การสร้างล็อตจะบันทึก QR ใน{" "}
          <span className="font-medium">production_lots</span> และการติดตามขั้นตอนจะอ่านจาก{" "}
          <span className="font-medium">production_lot_tracking</span>
        </span>
      </p>

      <div className="flex flex-wrap items-end gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            จำนวนต่อล็อต (บรรจุ)
          </label>
          <input
            type="number"
            min={1}
            value={packSizeInput}
            onChange={(e) => setPackSizeInput(e.target.value)}
            className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white text-sm"
          />
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 pb-2">
          จะได้ประมาณ{" "}
          <strong className="text-gray-900 dark:text-white">{previewCount}</strong>{" "}
          QR
        </div>
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={syncing}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {syncing ? "กำลังบันทึก…" : "สร้าง / สร้างใหม่ QR ล็อต"}
        </button>
        <button
          type="button"
          onClick={handlePrintAll}
          disabled={lots.length === 0}
          className="px-4 py-2 border border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 text-sm rounded-lg hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 disabled:opacity-40"
        >
          พิมพ์ QR ทั้งหมด
        </button>
      </div>

      {msg && (
        <p className="text-xs text-indigo-800 dark:text-indigo-200 mb-3">{msg}</p>
      )}

      <div className="overflow-x-auto rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 bg-white dark:bg-gray-900/40">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-indigo-100/80 dark:bg-indigo-900/40">
              <th className="px-3 py-2 text-left text-indigo-900 dark:text-indigo-100">
                #
              </th>
              <th className="px-3 py-2 text-left text-indigo-900 dark:text-indigo-100">
                จำนวนในล็อต
              </th>
              <th className="px-3 py-2 text-left text-indigo-900 dark:text-indigo-100">
                ขั้นตอนปัจจุบัน
              </th>
              <th className="px-3 py-2 text-center text-indigo-900 dark:text-indigo-100">
                Lot status
              </th>
              <th className="px-3 py-2 text-center text-indigo-900 dark:text-indigo-100">
                QR
              </th>
              <th className="px-3 py-2 text-left text-indigo-900 dark:text-indigo-100 font-mono text-xs">
                ค่าใน QR
              </th>
              <th className="px-3 py-2 text-center text-indigo-900 dark:text-indigo-100">
                ติดตาม
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {lots.length === 0 ? (
              <TableEmptyRow colSpan={7} />
            ) : (
              lots.map((r) => (
                <tr key={r.qrPayload} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {(() => {
                    const st = statusByQr[r.qrPayload];
                    return (
                      <>
                  <td className="px-3 py-2 font-medium">{r.lotIndex + 1}</td>
                  <td className="px-3 py-2">
                    {r.quantity.toLocaleString()} {r.unit}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs text-gray-800 dark:text-gray-200">
                      {st?.stepSummaryTh || "ยังไม่มีประวัติขั้นตอนใน DB"}
                    </div>
                    {st?.currentProcessCode ? (
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {st.currentProcessCode}
                        {st.currentProcess ? ` - ${st.currentProcess}` : ""}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-flex px-2 py-1 rounded-full text-[11px] bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">
                      {st?.status || "UNKNOWN"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <QRCodeGenerator value={r.qrPayload} size={72} className="mx-auto" />
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-gray-700 dark:text-gray-300 break-all max-w-[180px]">
                    {r.qrPayload}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <a
                      href="/pc/production-step-scan"
                      className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 hover:opacity-90"
                    >
                      เปิดหน้าอัปเดต
                    </a>
                  </td>
                      </>
                    );
                  })()}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {statusLoading && lots.length > 0 && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          กำลังโหลดสถานะล่าสุดจากฐานข้อมูล...
        </p>
      )}

    </div>
  );
}
