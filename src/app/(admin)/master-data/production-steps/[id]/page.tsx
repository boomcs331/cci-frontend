"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import AlertComponent from "@/components/ui/alert/Alert";
import {
  getMasterProductionProcesses,
  getProductProductionSteps,
  setProductProductionSteps,
} from "@/services/productProductionStepsService";
import type { ProductionProcess, ProductionStepDraft } from "@/types/production";
import { getApiUrl } from "@/utils/api";

export default function MasterDataProductProductionStepsEditorPage() {
  const params = useParams();
  const productIdRaw = params.id;
  const productId = useMemo(() => Number(productIdRaw), [productIdRaw]);

  const [product, setProduct] = useState<any>(null);
  const [bomsCount, setBomsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [masterProcesses, setMasterProcesses] = useState<ProductionProcess[]>([]);
  const [stepsDraft, setStepsDraft] = useState<ProductionStepDraft[]>([]);
  const [stepsLoading, setStepsLoading] = useState(true);
  const [stepsSaving, setStepsSaving] = useState(false);
  const [addProcessId, setAddProcessId] = useState<string>("");

  const [alertMsg, setAlertMsg] = useState<{
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!Number.isFinite(productId) || Number.isNaN(productId)) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(getApiUrl(`/products/${productId}`));
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (cancelled) return;
        const p = json?.data ?? null;
        setProduct(p);
        setBomsCount(p?.boms?.length ?? 0);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    if (!Number.isFinite(productId) || Number.isNaN(productId)) return;
    let cancelled = false;
    const run = async () => {
      setStepsLoading(true);
      try {
        const [steps, master] = await Promise.all([
          getProductProductionSteps(productId),
          getMasterProductionProcesses(),
        ]);
        if (cancelled) return;
        setMasterProcesses(master.filter((p) => p.isActive));
        setStepsDraft(
          steps.map((s) => ({
            processCode: s.process.processCode,
            processName: s.process.processName,
          }))
        );
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setMasterProcesses([]);
          setStepsDraft([]);
        }
      } finally {
        if (!cancelled) setStepsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const moveStep = (index: number, delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= stepsDraft.length) return;
    setStepsDraft((prev) => {
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };

  const removeStep = (index: number) => {
    setStepsDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const addStepFromMaster = () => {
    if (!addProcessId) return;
    const p = masterProcesses.find((m) => String(m.id) === addProcessId);
    if (!p) return;
    if (stepsDraft.some((s) => s.processCode === p.processCode)) {
      setAlertMsg({
        variant: "warning",
        title: "ซ้ำ",
        message: `มี ${p.processCode} ในลำดับแล้ว`,
      });
      return;
    }
    setStepsDraft((prev) => [...prev, { processCode: p.processCode, processName: p.processName }]);
    setAddProcessId("");
  };

  const save = async () => {
    if (!Number.isFinite(productId) || Number.isNaN(productId)) return;
    if (stepsDraft.length > 0 && bomsCount === 0) {
      setAlertMsg({
        variant: "warning",
        title: "ต้องมี BOM ก่อน",
        message: "เพิ่มรายการวัตถุดิบใน BOM อย่างน้อย 1 รายการก่อนบันทึกลำดับขั้นตอนผลิต",
      });
      return;
    }
    setStepsSaving(true);
    setAlertMsg(null);
    try {
      await setProductProductionSteps(productId, { steps: stepsDraft });
      setAlertMsg({ variant: "success", title: "สำเร็จ", message: "บันทึกลำดับขั้นตอนผลิตแล้ว" });
      setTimeout(() => setAlertMsg(null), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "บันทึกไม่สำเร็จ";
      setAlertMsg({ variant: "error", title: "เกิดข้อผิดพลาด", message: msg });
    } finally {
      setStepsSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Master Data - ลำดับขั้นตอนผลิต" />
        <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Master Data - ลำดับขั้นตอนผลิต" />

      {alertMsg && (
        <div className="mb-6">
          <AlertComponent variant={alertMsg.variant} title={alertMsg.title} message={alertMsg.message} />
        </div>
      )}

      <ComponentCard title={`ลำดับขั้นตอนผลิต — ${product?.productCode ?? ""} ${product?.productName ?? ""}`}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            BOM: <span className="font-medium text-gray-900 dark:text-white">{bomsCount}</span>
          </div>
          <Link
            href={`/production/products/${productId}/bom`}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
          >
            ไปหน้า BOM ของสินค้า
          </Link>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          ขั้นบนสุดทำก่อน — ลำดับนี้ใช้กับการไล่ขั้น QR/Lot บน backend ตามสินค้านี้
        </p>

        {stepsLoading ? (
          <div className="text-center py-6 text-gray-500">กำลังโหลดขั้นตอน...</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 items-end mb-4">
              <div className="min-w-[220px] flex-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  เพิ่มจาก master
                </label>
                <select
                  value={addProcessId}
                  onChange={(e) => setAddProcessId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="">เลือกขั้นตอน</option>
                  {masterProcesses.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.processCode} — {p.processName}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={addStepFromMaster}
                disabled={!addProcessId}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md disabled:opacity-50"
              >
                เพิ่มในลำดับ
              </button>
              <button
                type="button"
                onClick={save}
                disabled={stepsSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
              >
                {stepsSaving ? "กำลังบันทึก..." : "บันทึกลำดับ"}
              </button>
            </div>

            {stepsDraft.length === 0 ? (
              <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                ยังไม่มีขั้นตอน — เลือกจาก master แล้วกด &quot;เพิ่มในลำดับ&quot;
              </div>
            ) : (
              <ul className="space-y-2">
                {stepsDraft.map((s, i) => (
                  <li
                    key={`${s.processCode}-${i}`}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-sm font-semibold text-gray-500 w-8">{i + 1}</span>
                    <span className="flex-1 text-sm text-gray-900 dark:text-white">
                      <span className="font-mono">{s.processCode}</span>
                      {s.processName ? <span className="text-gray-600 dark:text-gray-400"> — {s.processName}</span> : null}
                    </span>
                    <button
                      type="button"
                      onClick={() => moveStep(i, -1)}
                      disabled={i === 0}
                      className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(i, 1)}
                      disabled={i === stepsDraft.length - 1}
                      className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="text-red-600 hover:text-red-800 text-sm px-2"
                    >
                      ลบ
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </ComponentCard>
    </div>
  );
}

