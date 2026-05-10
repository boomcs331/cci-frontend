"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/utils/api";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import {
  advanceLotStep,
  decodeProductionLotQr,
  getLotRecord,
  labelsForRecord,
  maxStepForRecord,
  PRODUCTION_LOT_QR_PREFIX,
  stepLabelForRecord,
} from "@/utils/productionLotTracking";

export type QrLookupMode = "all" | "material" | "product";

export type ProductLotStatusPayload = {
  lotNo: string;
  qrCode: string;
  quantity: number;
  status: string;
  orderNo: string;
  orderCreateDate?: string | null;
  productCode: string;
  productName: string;
  currentProcess?: string | null;
  currentProcessCode?: string | null;
  currentStepPhase?: "IN_PROGRESS" | "WAITING_START" | "COMPLETED" | null;
  /** Thai summary of which step the lot is at */
  stepSummaryTh?: string | null;
  /** Thai alert when user department cannot operate this step */
  departmentAlertTh?: string | null;
  userDepartmentCode?: string | null;
  canOperateCurrentStep?: boolean;
  expectedProcess?: {
    processId: number;
    processCode: string;
    processName: string;
    allowedDepartmentCodes?: string[] | null;
  } | null;
  inProgressStep?: {
    processId: number;
    processCode: string;
    processName: string;
    allowedDepartmentCodes?: string[] | null;
    startTime?: string;
  } | null;
  tracking: {
    processCode: string;
    processName: string;
    startTime?: string | null;
    endTime?: string | null;
    status: string;
    operator?: string | null;
    remarks?: string | null;
    duration?: string | null;
  }[];
};

export type QrCodeLookupPanelProps = {
  /** false = ล้างช่องและผลลัพธ์ (สลับแท็บ / ปิดหน้าต่าง) */
  active: boolean;
  /** all = วัตถุดิบ + ล็อตในเครื่องแบบเดิม; material / product = แยกเส้นทางชัดเจน */
  mode?: QrLookupMode;
  /** แสดงใต้หัวข้อย่อย (ถ้ามี) */
  contextHint?: string;
  /** ต่อท้าย id ของ input/label ให้ไม่ชนกันเมื่อมีหลาย instance */
  instanceId?: string;
  /** ซ่อนบล็อก contextHint (ใช้เมื่อหัวข้ออยู่ข้างนอก) */
  hideContextHint?: boolean;
  /** แสดงบรรทัดอธิบายการใช้ — ปิดเมื่อหัว modal มีข้อความเดียวกันแล้ว */
  showUsageHint?: boolean;
};

/**
 * ฟอร์มกรอก/วาง QR + ผลลัพธ์ — ใช้ร่วมกับ QRScannerModal และปุ่มลอยตรวจสอบ QR
 */
export function QrCodeLookupPanel({
  active,
  mode = "all",
  contextHint,
  instanceId = "default",
  hideContextHint = false,
  showUsageHint = true,
}: QrCodeLookupPanelProps) {
  const [qrCode, setQrCode] = useState("");
  const [lotData, setLotData] = useState<any>(null);
  const [productionLot, setProductionLot] = useState<ReturnType<typeof getLotRecord>>(undefined);
  const [productionMissing, setProductionMissing] = useState(false);
  const [productLotData, setProductLotData] = useState<ProductLotStatusPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `qr-lookup-input-${instanceId}`;

  const resetResults = useCallback(() => {
    setLotData(null);
    setProductionLot(undefined);
    setProductionMissing(false);
    setProductLotData(null);
    setLookupError(null);
  }, []);

  useEffect(() => {
    if (!active) {
      setQrCode("");
      resetResults();
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(t);
  }, [active, resetResults]);

  const submitLookup = useCallback(async () => {
    const code = qrCode.trim();
    if (!code) {
      setLookupError("กรุณากรอกหรือวางค่า QR แล้วกดตรวจสอบ");
      return;
    }

    setLookupError(null);
    setLoading(true);
    setLotData(null);
    setProductionLot(undefined);
    setProductionMissing(false);
    setProductLotData(null);

    let clearInput = false;

    const wrongTabMaterial =
      "รูปแบบนี้เป็น QR ล็อตผลิต/สินค้า — ใช้แท็บ «ตรวจสอบ QR Products»";

    try {
      if (mode === "material") {
        if (getLotRecord(code) || decodeProductionLotQr(code) || code.startsWith(PRODUCTION_LOT_QR_PREFIX)) {
          setLookupError(wrongTabMaterial);
          return;
        }
        const res = await apiFetch(`/materials/transactions/qr/${encodeURIComponent(code)}`);
        const result = await res.json();
        if (result.success) {
          setLotData(result.data);
          clearInput = true;
        } else {
          setLookupError(result.message || "ไม่พบข้อมูลล็อตวัตถุดิบตามรหัสนี้");
        }
        return;
      }

      if (mode === "product") {
        const existing = getLotRecord(code);
        if (existing) {
          setProductionLot(existing);
          clearInput = true;
          return;
        }
        if (decodeProductionLotQr(code)) {
          setProductionMissing(true);
          return;
        }
        const res = await apiFetch(`/production-orders/lots/${encodeURIComponent(code)}/status`);
        if (res.status === 403) {
          setLookupError("ไม่มีสิทธิ์ดูสถานะล็อตผลิต (production_orders.read)");
          return;
        }
        if (res.status === 404) {
          setLookupError("ไม่พบล็อตผลิต/สินค้าตาม QR นี้ — ถ้าเป็นล็อตวัตถุดิบให้ใช้แท็บ Material");
          return;
        }
        if (!res.ok) {
          setLookupError("ไม่สามารถโหลดสถานะล็อตได้");
          return;
        }
        const data = (await res.json()) as ProductLotStatusPayload;
        if (data?.qrCode) {
          setProductLotData(data);
          clearInput = true;
        } else {
          setLookupError("ข้อมูลล็อตไม่สมบูรณ์");
        }
        return;
      }

      // mode === "all"
      const existingAll = getLotRecord(code);
      if (existingAll) {
        setProductionLot(existingAll);
        clearInput = true;
        return;
      }
      const plDecodeAll = decodeProductionLotQr(code);
      if (plDecodeAll) {
        setProductionMissing(true);
        return;
      }
      const res = await apiFetch(`/materials/transactions/qr/${encodeURIComponent(code)}`);
      const result = await res.json();
      if (result.success) {
        setLotData(result.data);
        clearInput = true;
      } else {
        setLookupError(result.message || "ไม่พบข้อมูลล็อตวัตถุดิบตามรหัสนี้");
      }
    } catch {
      setLookupError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
      if (clearInput) setQrCode("");
      inputRef.current?.focus();
    }
  }, [qrCode, mode]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitLookup();
  };

  const handleClear = () => {
    setQrCode("");
    resetResults();
    inputRef.current?.focus();
  };

  const handleProductionNext = () => {
    if (!productionLot) return;
    const next = advanceLotStep(productionLot.qrPayload);
    if (next) setProductionLot(next);
  };

  const usageLine =
    mode === "material"
      ? "เฉพาะล็อตวัตถุดิบ (รับเข้า FIFO) — รหัสเช่น QR-… กด Enter หรือปุ่มตรวจสอบ"
      : mode === "product"
        ? "ล็อตผลิต/สินค้า: QR-PG… จากระบบ หรือ CCI:PL… (ติดตามในเครื่อง) — กด Enter หรือปุ่มตรวจสอบ"
        : "กรอก วาง หรือยิงจากเครื่องอ่านบาร์โค้ด — กด Enter หรือปุ่มตรวจสอบ (เหมือนปุ่ม «ตรวจสอบ QR» ที่ /pc/outcome)";

  const placeholder =
    mode === "material"
      ? "เช่น QR-… (ล็อตวัตถุดิบ)"
      : mode === "product"
        ? "เช่น QR-PG… หรือ CCI:PL:…"
        : "เช่น QR-… (วัตถุดิบ) หรือ CCI:PL:… / QR-PG… (ล็อตผลิต)";

  if (!active) return null;

  return (
    <div className="space-y-4">
      {contextHint && !hideContextHint ? (
        <p className="rounded-lg border border-blue-light-200 bg-blue-light-50 px-3 py-2 text-xs text-blue-light-900 dark:border-blue-light-800/50 dark:bg-blue-light-950/25 dark:text-blue-light-100">
          {contextHint}
        </p>
      ) : null}

      {showUsageHint ? <p className="text-xs text-gray-500 dark:text-gray-400">{usageLine}</p> : null}

      <form onSubmit={handleFormSubmit} className="space-y-3">
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          ค่า QR / บาร์โค้ด
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={qrCode}
          onChange={(e) => {
            setQrCode(e.target.value);
            if (lookupError) setLookupError(null);
          }}
          placeholder={placeholder}
          className="h-12 w-full rounded-lg border-2 border-brand-500 bg-white px-3 text-base text-gray-900 dark:border-brand-500 dark:bg-gray-900 dark:text-white sm:h-14 sm:px-4 sm:text-lg"
          disabled={loading}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 sm:px-5 sm:py-2.5"
          >
            {loading ? "กำลังตรวจสอบ…" : "ตรวจสอบ"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            ล้างช่องและผลลัพธ์
          </button>
        </div>
      </form>

      {lookupError ? (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-800 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-200">
          {lookupError}
        </div>
      ) : null}

      {loading ? <div className="py-6 text-center text-sm text-gray-500">กำลังโหลด…</div> : null}

      {mode !== "material" && productionMissing && !loading ? (
        <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20 sm:p-6">
          <h3 className="mb-2 font-semibold text-amber-900 dark:text-amber-100">QR ล็อตผลิต</h3>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            รูปแบบ QR ล็อตถูกต้อง แต่ยังไม่มีข้อมูลในเครื่องนี้ — ให้สร้างหรือซิงก์ล็อตจากแผนที่ยืนยันและจ่ายออกแล้วก่อน
          </p>
        </div>
      ) : null}

      {mode !== "material" && productionLot && !loading ? (
        <div className="space-y-4 rounded-lg border-2 border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-800 dark:bg-indigo-950/20 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 sm:text-xl">ล็อตผลิต (ในเครื่อง)</h2>
            <span className="break-all font-mono text-xs text-indigo-700 dark:text-indigo-300 sm:max-w-[50%] sm:text-right">
              {productionLot.qrPayload}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-gray-500 dark:text-gray-400">แผน</span>
              <div className="font-medium text-gray-900 dark:text-white">{productionLot.planCode}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">สินค้า</span>
              <div className="font-medium text-gray-900 dark:text-white">{productionLot.productName}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">ล็อตที่</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {productionLot.lotIndex + 1} (จำนวนในล็อต {productionLot.quantity.toLocaleString()} {productionLot.unit})
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">อัปเดตล่าสุด</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {new Date(productionLot.updatedAt).toLocaleString("th-TH")}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-white p-4 dark:border-indigo-700 dark:bg-gray-900">
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">ขั้นตอนปัจจุบัน</p>
            <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300 sm:text-2xl">
              {stepLabelForRecord(productionLot, productionLot.stepIndex)}
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {labelsForRecord(productionLot).map((label, idx) => (
                <span
                  key={`${idx}-${label}`}
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    idx === productionLot.stepIndex
                      ? "bg-indigo-600 text-white"
                      : idx < productionLot.stepIndex
                        ? "bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-100"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {idx + 1}. {label}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleProductionNext}
            disabled={productionLot.stepIndex >= maxStepForRecord(productionLot)}
            className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ย้ายไปขั้นตอนถัดไป
          </button>
        </div>
      ) : null}

      {productLotData && !loading && mode !== "material" ? (
        <div className="space-y-4 rounded-lg border-2 border-violet-200 bg-violet-50/50 p-4 dark:border-violet-800 dark:bg-violet-950/20 sm:p-6">
          <h2 className="text-lg font-bold text-violet-900 dark:text-violet-100 sm:text-xl">ล็อตผลิต (ระบบ)</h2>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-gray-500 dark:text-gray-400">ใบสั่ง</span>
              <div className="font-medium text-gray-900 dark:text-white">{productLotData.orderNo}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">วันที่สั่งผลิต</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {productLotData.orderCreateDate
                  ? new Date(productLotData.orderCreateDate).toLocaleDateString("th-TH")
                  : "—"}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">สินค้า</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {productLotData.productCode} — {productLotData.productName}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Lot No</span>
              <div className="font-medium text-gray-900 dark:text-white">{productLotData.lotNo}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">QR</span>
              <div className="break-all font-mono text-xs text-gray-900 dark:text-white">{productLotData.qrCode}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">จำนวนล็อต</span>
              <div className="font-medium text-gray-900 dark:text-white">{productLotData.quantity}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">สถานะ</span>
              <div className="font-medium text-gray-900 dark:text-white">{productLotData.status}</div>
            </div>
            {productLotData.userDepartmentCode !== undefined &&
            productLotData.userDepartmentCode !== null ? (
              <div>
                <span className="text-gray-500 dark:text-gray-400">แผนก (จาก session)</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {productLotData.userDepartmentCode || "—"}
                </div>
              </div>
            ) : null}
            {productLotData.currentProcess || productLotData.stepSummaryTh ? (
              <div className="sm:col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Current step (server)</span>
                {productLotData.stepSummaryTh ? (
                  <div className="mt-1 rounded-lg border border-violet-200 bg-white px-3 py-2 text-base font-semibold text-violet-900 dark:border-violet-700 dark:bg-gray-900 dark:text-violet-100">
                    {productLotData.stepSummaryTh}
                  </div>
                ) : null}
                {productLotData.currentProcess ? (
                  <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {productLotData.currentProcessCode
                      ? `${productLotData.currentProcessCode} — `
                      : ""}
                    {productLotData.currentProcess}
                  </div>
                ) : null}
                {productLotData.currentStepPhase ? (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    สถานะขั้น: {productLotData.currentStepPhase}
                    {productLotData.canOperateCurrentStep === false ? (
                      <span className="text-amber-700 dark:text-amber-300">
                        {" "}
                        (บัญชีนี้ยังเริ่ม/ปิดงานขั้นนี้ไม่ได้ — ตรวจแผนกหรือสิทธิ์)
                      </span>
                    ) : null}
                  </p>
                ) : null}
              </div>
            ) : null}
            {productLotData.departmentAlertTh ? (
              <div className="sm:col-span-2 rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
                {productLotData.departmentAlertTh}
              </div>
            ) : null}
          </div>
          <div className="overflow-x-auto rounded-lg border border-violet-200 dark:border-violet-800">
            <table className="w-full min-w-[480px] text-left text-xs sm:text-sm">
              <thead className="bg-violet-100/80 dark:bg-violet-900/40">
                <tr>
                  <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200">ขั้นตอน</th>
                  <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200">สถานะ</th>
                  <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200">เริ่ม</th>
                  <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200">จบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-100 dark:divide-violet-800/80">
                {(productLotData.tracking ?? []).length === 0 ? (
                  <TableEmptyRow colSpan={4} />
                ) : (
                  (productLotData.tracking ?? []).map((t, i) => (
                    <tr key={`${t.processCode}-${i}`} className="bg-white/80 dark:bg-gray-900/40">
                      <td className="px-3 py-2 text-gray-900 dark:text-white">{t.processName}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{t.status}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                        {t.startTime ? new Date(t.startTime).toLocaleString("th-TH") : "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                        {t.endTime ? new Date(t.endTime).toLocaleString("th-TH") : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {lotData && !loading ? (
        <div className="space-y-4 rounded-lg border-2 border-gray-200 p-4 dark:border-gray-700 sm:p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{lotData.material?.matName}</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">รหัสวัตถุดิบ:</span>
              <div className="font-medium text-gray-900 dark:text-white">{lotData.material?.matCode}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">ชื่อวัตถุดิบ:</span>
              <div className="font-medium text-gray-900 dark:text-white">{lotData.material?.matName}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Lot No:</span>
              <div className="font-medium text-gray-900 dark:text-white">{lotData.lotNo}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Lot PD No:</span>
              <div className="font-medium text-gray-900 dark:text-white">{lotData.lotPdNo || "-"}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">QR Code:</span>
              <div className="font-medium text-gray-900 dark:text-white">{lotData.qrCode}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">สถานะ:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    lotData.status === "ACTIVE"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : lotData.status === "USED_UP"
                        ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                  }`}
                >
                  {lotData.status}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">จำนวนคงเหลือ</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 sm:text-4xl">
              {parseFloat(lotData.remainingQuantity).toLocaleString()} {lotData.unit}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">จำนวนเริ่มต้น:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {parseFloat(lotData.quantity).toLocaleString()} {lotData.unit}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">ที่เก็บ:</span>
              <div className="font-medium text-gray-900 dark:text-white">{lotData.location?.name || "-"}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">ซัพพลายเออร์:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {lotData.receiving?.supplier?.name || "-"}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">วันที่รับเข้า:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {lotData.receiving?.receivingDate
                  ? new Date(lotData.receiving.receivingDate).toLocaleDateString("th-TH")
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
