"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import Alert from "@/components/ui/alert/Alert";
import { apiFetch } from "@/utils/api";
import {
  createProductionProcess,
  deleteProductionProcess,
  listProductionProcesses,
  updateProductionProcess,
} from "@/services/productionProcessesService";
import type { ProductionProcess } from "@/types/production";

interface Department {
  id: number;
  code: string;
  name: string;
}

type ActiveFilter = "all" | "active" | "inactive";

const emptyForm = {
  processCode: "",
  processName: "",
  sequenceOrder: "1",
  isActive: true,
  deptCodes: "",
};

function parseDeptCodesInput(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function formatDeptCodes(codes?: string[] | null): string {
  return codes?.length ? codes.join(", ") : "";
}

function PageContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const [rows, setRows] = useState<ProductionProcess[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [departments, setDepartments] = useState<Department[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProductionProcess | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const isActiveParam =
    activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listProductionProcesses({
        page,
        limit,
        search: search || undefined,
        isActive: isActiveParam,
      });
      setRows(result.data);
      setPagination({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, isActiveParam]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    let cancelled = false;
    const loadDepts = async () => {
      try {
        const res = await apiFetch("/auth/departments");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { departments?: Department[] };
        if (!cancelled) setDepartments(data.departments ?? []);
      } catch {
        /* optional */
      }
    };
    void loadDepts();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCreate = () => {
    setEditing(null);
    const nextSeq =
      rows.length > 0 ? Math.max(...rows.map((r) => r.sequenceOrder)) + 1 : 1;
    setForm({ ...emptyForm, sequenceOrder: String(nextSeq) });
    setShowModal(true);
  };

  const openEdit = (row: ProductionProcess) => {
    setEditing(row);
    setForm({
      processCode: row.processCode,
      processName: row.processName,
      sequenceOrder: String(row.sequenceOrder),
      isActive: row.isActive,
      deptCodes: formatDeptCodes(row.allowedDepartmentCodes),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sequenceOrder = parseInt(form.sequenceOrder, 10);
    if (!form.processCode.trim() || !form.processName.trim() || !sequenceOrder) {
      setMessage({ type: "error", text: "กรุณากรอกข้อมูลให้ครบ" });
      return;
    }
    const allowedDepartmentCodes = parseDeptCodesInput(form.deptCodes);
    const payload = {
      processCode: form.processCode.trim(),
      processName: form.processName.trim(),
      sequenceOrder,
      isActive: form.isActive,
      allowedDepartmentCodes: allowedDepartmentCodes.length
        ? allowedDepartmentCodes
        : undefined,
    };
    try {
      if (editing) {
        await updateProductionProcess(editing.id, {
          ...payload,
          allowedDepartmentCodes: allowedDepartmentCodes.length
            ? allowedDepartmentCodes
            : null,
        });
        setMessage({ type: "success", text: "อัปเดตสำเร็จ" });
      } else {
        await createProductionProcess(payload);
        setMessage({ type: "success", text: "เพิ่มสำเร็จ" });
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(null);
      void fetchRows();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบกระบวนการผลิตนี้? (ถ้าถูกใช้งานจะปิดใช้งานแทน)")) return;
    try {
      const result = await deleteProductionProcess(id);
      setMessage({
        type: "success",
        text: result.deactivated
          ? "ถูกใช้งานอยู่ — ปิดใช้งานแทนการลบแล้ว"
          : "ลบสำเร็จ",
      });
      void fetchRows();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "ลบไม่สำเร็จ",
      });
    }
  };

  if (loading && rows.length === 0) {
    return <div className="text-center py-8">กำลังโหลด...</div>;
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="กระบวนการผลิต (Master)" />
      <div className="space-y-4">
        {message && (
          <Alert
            variant={message.type}
            title={message.type === "success" ? "สำเร็จ" : "ข้อผิดพลาด"}
            message={message.text}
          />
        )}
        <ComponentCard
          title={`กระบวนการผลิต — production_processes (${pagination?.total ?? 0})`}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Master ขั้นตอน/สถานีผลิต — ใช้กำหนดลำดับใน QR scan และขั้นตอนสินค้า
          </p>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <PaginationSelector currentLimit={limit} />
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">ใช้งาน</option>
                <option value="inactive">ปิดใช้งาน</option>
              </select>
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearch(searchInput.trim());
                }}
              >
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="ค้นหารหัส / ชื่อกระบวนการ"
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white min-w-[180px]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg"
                >
                  ค้นหา
                </button>
              </form>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              เพิ่มกระบวนการ
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-max w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-3 py-2 text-left text-sm font-medium">ลำดับ</th>
                  <th className="px-3 py-2 text-left text-sm font-medium">รหัส</th>
                  <th className="px-3 py-2 text-left text-sm font-medium">ชื่อ</th>
                  <th className="px-3 py-2 text-left text-sm font-medium">แผนกที่อนุญาต</th>
                  <th className="px-3 py-2 text-center text-sm font-medium w-20">สถานะ</th>
                  <th className="px-3 py-2 text-center text-sm font-medium w-28">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {rows.length === 0 ? (
                  <TableEmptyRow colSpan={6} />
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-2 text-sm text-center">{row.sequenceOrder}</td>
                      <td className="px-3 py-2 text-sm font-medium whitespace-nowrap">
                        {row.processCode}
                      </td>
                      <td className="px-3 py-2 text-sm whitespace-nowrap">{row.processName}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {formatDeptCodes(row.allowedDepartmentCodes) || "— (ทุกแผนก)"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            row.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {row.isActive ? "ใช้งาน" : "ปิด"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded mr-1"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(row.id)}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination && (
            <PaginationFooter
              size="sm"
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
            />
          )}
        </ComponentCard>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3 border-b flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editing ? "แก้ไขกระบวนการ" : "เพิ่มกระบวนการ"}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">รหัสกระบวนการ *</label>
                <input
                  type="text"
                  value={form.processCode}
                  onChange={(e) => setForm({ ...form, processCode: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  placeholder="เช่น WELDING"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ชื่อกระบวนการ *</label>
                <input
                  type="text"
                  value={form.processName}
                  onChange={(e) => setForm({ ...form, processName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ลำดับ (sequence_order) *</label>
                <input
                  type="number"
                  min={1}
                  value={form.sequenceOrder}
                  onChange={(e) => setForm({ ...form, sequenceOrder: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  แผนกที่อนุญาต (คั่นด้วย comma)
                </label>
                <input
                  type="text"
                  value={form.deptCodes}
                  onChange={(e) => setForm({ ...form, deptCodes: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  placeholder="เช่น WELDING, WE — ว่าง = ไม่จำกัดแผนก"
                />
                {departments.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    แผนกในระบบ: {departments.map((d) => d.code).join(", ")}
                  </p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                เปิดใช้งาน
              </label>
              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5 rounded-lg"
                >
                  บันทึก
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500 text-white text-sm py-1.5 rounded-lg"
                >
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

export default function ProductionProcessesMasterPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">กำลังโหลด...</div>}>
      <PageContent />
    </Suspense>
  );
}
