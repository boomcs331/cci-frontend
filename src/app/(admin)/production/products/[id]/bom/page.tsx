"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import AlertComponent from "@/components/ui/alert/Alert";
import {
  getProductProductionSteps,
  setProductProductionSteps,
  getMasterProductionProcesses,
} from "@/services/productProductionStepsService";
import type { ProductionProcess, ProductionStepDraft } from "@/types/production";

export default function ProductBOMPage() {
  const params = useParams();
  const productId = params.id;
  const [product, setProduct] = useState<any>(null);
  const [boms, setBoms] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ materialId: '', quantityPerUnit: '', unit: 'PCS' });
  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{variant: "success" | "error" | "warning" | "info", title: string, message: string} | null>(null);

  /** ลำดับขั้นตอนผลิต (รายการแรก = ขั้น 1) */
  const [masterProcesses, setMasterProcesses] = useState<ProductionProcess[]>([]);
  const [stepsDraft, setStepsDraft] = useState<ProductionStepDraft[]>([]);
  const [stepsLoading, setStepsLoading] = useState(true);
  const [stepsSaving, setStepsSaving] = useState(false);
  const [addProcessId, setAddProcessId] = useState<string>("");

  useEffect(() => {
    fetchProduct();
    fetchMaterials();
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    const id = Number(productId);
    if (Number.isNaN(id)) {
      setStepsLoading(false);
      return;
    }
    setStepsLoading(true);
    (async () => {
      try {
        const [steps, master] = await Promise.all([
          getProductProductionSteps(id),
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
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.data);
        setBoms(data.data.boms || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/materials/all`);
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlertMsg(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${productId}/bom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok) {
        setAlertMsg({variant: "success", title: "สำเร็จ", message: result.message || 'เพิ่มวัตถุดิบสำเร็จ'});
        setTimeout(() => {
          setShowModal(false);
          setFormData({ materialId: '', quantityPerUnit: '', unit: 'PCS' });
          setAlertMsg(null);
          fetchProduct();
        }, 1500);
      } else {
        setAlertMsg({variant: "error", title: "เกิดข้อผิดพลาด", message: result.message || JSON.stringify(result)});
      }
    } catch (error) {
      console.error(error);
      setAlertMsg({variant: "error", title: "เกิดข้อผิดพลาด", message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ'});
    } finally {
      setSaving(false);
    }
  };

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

  const saveProductionSteps = async () => {
    if (!productId) return;
    const id = Number(productId);
    if (Number.isNaN(id)) return;
    if (stepsDraft.length > 0 && boms.length === 0) {
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
      await setProductProductionSteps(id, { steps: stepsDraft });
      setAlertMsg({
        variant: "success",
        title: "สำเร็จ",
        message: "บันทึกลำดับขั้นตอนผลิตแล้ว",
      });
      setTimeout(() => setAlertMsg(null), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "บันทึกไม่สำเร็จ";
      setAlertMsg({ variant: "error", title: "เกิดข้อผิดพลาด", message: msg });
    } finally {
      setStepsSaving(false);
    }
  };

  const handleDelete = async (bomId: number) => {
    if (!confirm('ต้องการลบวัตถุดิบนี้หรือไม่?')) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${productId}/bom/${bomId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message || 'ลบวัตถุดิบสำเร็จ');
        fetchProduct();
      } else {
        alert('เกิดข้อผิดพลาด: ' + (result.message || JSON.stringify(result)));
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  if (loading) {
    return <div className="text-center py-8">กำลังโหลด...</div>;
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={`BOM - ${product?.productName}`} />
      {alertMsg && (
        <div className="mb-6">
          <AlertComponent variant={alertMsg.variant} title={alertMsg.title} message={alertMsg.message} />
        </div>
      )}
      <ComponentCard title={`รายการวัตถุดิบ (${boms.length})`}>
        <div className="mb-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">รหัสสินค้า: {product?.productCode}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">ชื่อสินค้า: {product?.productName}</p>
          </div>
          <button onClick={() => {
            setShowModal(true);
            setFormData({ materialId: '', quantityPerUnit: '', unit: 'PCS' });
            setAlertMsg(null);
          }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
            เพิ่มวัตถุดิบ
          </button>
        </div>

        {boms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">รหัสวัตถุดิบ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ชื่อวัตถุดิบ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ประเภท</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">จำนวน/หน่วย</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">หน่วย</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {boms.map((bom) => (
                  <tr key={bom.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{bom.material?.matCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{bom.material?.matName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{bom.material?.materialsType?.name}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{bom.quantityPerUnit}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{bom.unit}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDelete(bom.id)} className="text-red-600 hover:text-red-800 dark:text-red-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">ไม่มีรายการวัตถุดิบ</div>
        )}
      </ComponentCard>

      <ComponentCard title="ลำดับขั้นตอนผลิต (กำหนดหลัง BOM)">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          ขั้นบนสุดทำก่อน — ลำดับนี้ใช้กับการไล่ขั้น QR/Lot บน backend ตามสินค้านี้
        </p>
        {stepsLoading ? (
          <div className="text-center py-6 text-gray-500">กำลังโหลดขั้นตอน...</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 items-end mb-4">
              <div className="min-w-[200px] flex-1">
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
                onClick={saveProductionSteps}
                disabled={stepsSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
              >
                {stepsSaving ? "กำลังบันทึก..." : "บันทึกลำดับ"}
              </button>
            </div>

            {stepsDraft.length === 0 ? (
              <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                ยังไม่มีขั้นตอน — เลือกจาก master แล้วกด &quot;เพิ่มในลำดับ&quot; (แนะนำ: WELDING → PRESS → CHECKING → COMPLETE)
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
                      {s.processName ? (
                        <span className="text-gray-600 dark:text-gray-400"> — {s.processName}</span>
                      ) : null}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">เพิ่มวัตถุดิบ</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {alertMsg && (
                <AlertComponent variant={alertMsg.variant} title={alertMsg.title} message={alertMsg.message} />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">วัตถุดิบ <span className="text-red-500">*</span></label>
                <select value={formData.materialId} onChange={(e) => setFormData({...formData, materialId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" required>
                  <option value="">เลือกวัตถุดิบ</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.matCode} - {m.matName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">จำนวนต่อหน่วย <span className="text-red-500">*</span></label>
                <input type="number" step="0.0001" value={formData.quantityPerUnit} onChange={(e) => setFormData({...formData, quantityPerUnit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">หน่วย <span className="text-red-500">*</span></label>
                <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" required>
                  <option value="PCS">PCS</option>
                  <option value="KG">KG</option>
                  <option value="L">L</option>
                  <option value="M">M</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
