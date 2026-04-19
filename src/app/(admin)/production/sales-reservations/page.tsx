"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { apiFetch } from "@/utils/api";
import { PERMISSIONS, hasPermission } from "@/constants/permissions";
import { getUserPermissions } from "@/utils/session";
import { exportPdf, exportXlsx, type ExportColumn } from "@/utils/export";

interface ProductOption {
  id: number;
  productCode: string;
  productName: string;
}

interface SalesResDetail {
  id: string;
  referenceNo: string;
  quantity: number;
  createDate: string;
}

interface SalesResGroup {
  productId: number;
  productCode: string;
  productName: string;
  unit: string;
  totalReserved: number;
  details: SalesResDetail[];
}

function normalizeReservationPayload(raw: unknown): SalesResGroup[] {
  if (Array.isArray(raw)) {
    return raw as SalesResGroup[];
  }
  if (raw && typeof raw === "object") {
    const o = raw as { data?: unknown; reservations?: unknown };
    const inner = o.data ?? o.reservations;
    if (Array.isArray(inner)) {
      return inner as SalesResGroup[];
    }
  }
  return [];
}

export default function ProductionSalesReservationsPage() {
  const [groups, setGroups] = useState<SalesResGroup[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const canReserve = hasPermission(getUserPermissions(), PERMISSIONS.PRODUCTS_SALES_RESERVE);

  const loadReservations = useCallback(async () => {
    const res = await apiFetch("/products/sales-reservations");
    const json = (await res.json()) as { success?: boolean; data?: unknown };
    if (json.success) {
      setGroups(normalizeReservationPayload(json.data));
    } else {
      setGroups([]);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    const res = await apiFetch("/products/all");
    const json = (await res.json()) as { success?: boolean; data?: ProductOption[] };
    if (json.success && Array.isArray(json.data)) {
      setProducts(json.data);
    } else {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await Promise.all([loadReservations(), loadProducts()]);
      } catch (e) {
        console.error(e);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [loadReservations, loadProducts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReserve) return;
    const pid = parseInt(productId, 10);
    const qty = parseFloat(quantity);
    if (!pid || !referenceNo.trim() || !Number.isFinite(qty) || qty <= 0) {
      setMessage({ type: "error", text: "กรุณากรอกสินค้า จำนวน และเลขที่อ้างอิงการขาย" });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await apiFetch("/products/sales-reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: pid,
          quantity: qty,
          referenceNo: referenceNo.trim(),
          notes: notes.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { success?: boolean; message?: string };
      if (res.ok && json.success !== false) {
        setMessage({ type: "success", text: json.message ?? "จองสำเร็จ" });
        setReferenceNo("");
        setQuantity("");
        setNotes("");
        await loadReservations();
      } else {
        setMessage({ type: "error", text: json.message ?? "จองไม่สำเร็จ" });
      }
    } catch {
      setMessage({ type: "error", text: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async (id: string) => {
    if (!canReserve) return;
    if (!confirm("ยกเลิกการจองนี้และคืนจำนวนเข้าสต็อกพร้อมขาย?")) return;
    try {
      const res = await apiFetch(`/products/sales-reservations/${id}/release`, { method: "POST" });
      const json = (await res.json()) as { success?: boolean; message?: string };
      if (res.ok && json.success !== false) {
        setMessage({ type: "success", text: json.message ?? "ยกเลิกการจองแล้ว" });
        await loadReservations();
      } else {
        setMessage({ type: "error", text: json.message ?? "ดำเนินการไม่สำเร็จ" });
      }
    } catch {
      setMessage({ type: "error", text: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ" });
    }
  };

  type SalesFlatRow = {
    productCode: string;
    productName: string;
    unit: string;
    referenceNo: string;
    quantity: number;
    createDate: string;
  };

  const flatRows = useMemo<SalesFlatRow[]>(() => {
    const rows: SalesFlatRow[] = [];
    for (const g of groups) {
      for (const d of g.details) {
        rows.push({
          productCode: g.productCode,
          productName: g.productName,
          unit: g.unit,
          referenceNo: d.referenceNo,
          quantity: Number(d.quantity) || 0,
          createDate: d.createDate ?? "",
        });
      }
    }
    return rows;
  }, [groups]);

  const exportColumns = useMemo<ExportColumn<SalesFlatRow>[]>(
    () => [
      { header: "รหัสสินค้า", accessor: (r) => r.productCode },
      { header: "ชื่อสินค้า", accessor: (r) => r.productName },
      { header: "เลขที่อ้างอิง", accessor: (r) => r.referenceNo },
      { header: "จำนวน", accessor: (r) => r.quantity },
      { header: "หน่วย", accessor: (r) => r.unit },
      {
        header: "วันที่",
        accessor: (r) => (r.createDate ? new Date(r.createDate).toLocaleString("th-TH") : ""),
      },
    ],
    [],
  );

  const handleExportXlsx = () => {
    exportXlsx({
      filename: `sales-reservations_${new Date().toISOString().slice(0, 10)}`,
      columns: exportColumns,
      rows: flatRows,
    });
  };

  const handleExportPdf = () => {
    exportPdf({
      filename: `sales-reservations_${new Date().toISOString().slice(0, 10)}`,
      columns: exportColumns,
      rows: flatRows,
    });
  };

  const handleFulfill = async (id: string) => {
    if (!canReserve) return;
    if (!confirm("ตัดขาย (หักจากสต็อกรวมและจอง) — ยืนยัน?")) return;
    try {
      const res = await apiFetch(`/products/sales-reservations/${id}/fulfill`, { method: "POST" });
      const json = (await res.json()) as { success?: boolean; message?: string };
      if (res.ok && json.success !== false) {
        setMessage({ type: "success", text: json.message ?? "ตัดขายสำเร็จ" });
        await loadReservations();
      } else {
        setMessage({ type: "error", text: json.message ?? "ดำเนินการไม่สำเร็จ" });
      }
    } catch {
      setMessage({ type: "error", text: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ" });
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="จองสินค้าเพื่อขาย" />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">จองสินค้าเพื่อขาย</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            หลักการเดียวกับการจองวัตถุดิบ: ตัดจากคงเหลือพร้อมขาย ไปเป็นยอดจอง — ยกเลิกคืนสต็อก / ตัดขายหักจากสต็อกรวม
          </p>
        </div>

        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {canReserve && (
          <ComponentCard title="สร้างการจอง">
            <form onSubmit={handleCreate} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">สินค้า</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">— เลือกสินค้า —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productCode} — {p.productName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">จำนวนจอง</label>
                <input
                  type="number"
                  step="any"
                  min="0.0001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  เลขที่อ้างอิงการขาย / ใบสั่ง
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="เช่น SO-2026-0001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หมายเหตุ</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "กำลังบันทึก..." : "บันทึกการจอง"}
              </button>
            </form>
          </ComponentCard>
        )}

        {!canReserve && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            คุณมีสิทธิ์ดูรายการจองเท่านั้น (ไม่มีสิทธิ์ products.sales.reserve)
          </p>
        )}

        <ComponentCard title={`รายการจองที่ ACTIVE (${groups.length} สินค้า)`}>
          <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
            <button
              type="button"
              onClick={handleExportXlsx}
              disabled={flatRows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-800/60"
            >
              Export XLSX
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={flatRows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-800/60"
            >
              Export PDF
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">ไม่มีรายการจองที่ ACTIVE</div>
          ) : (
            groups.map((item) => (
              <div key={item.productId} className="mb-8 border-b pb-6 last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {item.productName} ({item.productCode}) — จองรวม {item.totalReserved.toLocaleString()} {item.unit}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                          เลขที่อ้างอิง
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">จำนวน</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วันที่</th>
                        {canReserve && (
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                            การทำงาน
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {item.details.map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{d.referenceNo}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                            {d.quantity.toLocaleString()} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {d.createDate ? new Date(d.createDate).toLocaleString() : "—"}
                          </td>
                          {canReserve && (
                            <td className="px-4 py-3 text-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleRelease(d.id)}
                                className="text-xs px-2 py-1 rounded border border-gray-400 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                ยกเลิกจอง
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFulfill(d.id)}
                                className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                ตัดขาย
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
