"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PageContainer,
  PageHeader,
  ContentCard,
  DataTable,
  ActionButton,
  BaseModal,
  LoadingState,
  StatusBadge,
  type Column,
} from "@/components/shared";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
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

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const columns: Column<ProductionProcess>[] = [
    { key: 'sequenceOrder', title: 'ลำดับ', width: '80px', render: (value) => <span className="text-center block">{value}</span> },
    { key: 'processCode', title: 'รหัส' },
    { key: 'processName', title: 'ชื่อ' },
    { 
      key: 'allowedDepartmentCodes', 
      title: 'แผนกที่อนุญาต',
      render: (value) => formatDeptCodes(value) || "— (ทุกแผนก)"
    },
    {
      key: 'isActive',
      title: 'สถานะ',
      width: '100px',
      render: (value) => (
        <span
          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
            value
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          {value ? "ใช้งาน" : "ปิด"}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'จัดการ',
      width: '150px',
      render: (_, row) => (
        <div className="flex gap-2 justify-center">
          <ActionButton variant="secondary" size="sm" onClick={() => openEdit(row)}>
            แก้ไข
          </ActionButton>
          <ActionButton variant="danger" size="sm" onClick={() => setDeleteId(row.id)}>
            ลบ
          </ActionButton>
        </div>
      ),
    },
  ];

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const result = await deleteProductionProcess(deleteId);
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
    } finally {
      setDeleteId(null);
    }
  };

  if (loading && rows.length === 0) {
    return <LoadingState message="กำลังโหลด..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="กระบวนการผลิต (Master)"
        description={`production_processes (${pagination?.total ?? 0})`}
        actions={
          <ActionButton variant="primary" onClick={openCreate}>
            เพิ่มกระบวนการ
          </ActionButton>
        }
      />

      {message && (
        <div className={`mb-4 rounded-lg px-4 py-3 ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
            : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
        }`}>
          {message.text}
        </div>
      )}

      <ContentCard>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Master ขั้นตอน/สถานีผลิต — ใช้กำหนดลำดับใน QR scan และขั้นตอนสินค้า
        </p>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
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
        </div>
        <DataTable
          columns={columns}
          data={rows}
          emptyMessage="ไม่พบข้อมูลกระบวนการผลิต"
          rowKey="id"
        />
        {pagination && (
          <PaginationFooter
            size="sm"
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
          />
        )}
      </ContentCard>

      <BaseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${editing ? "แก้ไข" : "เพิ่ม"}กระบวนการ`}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              รหัสกระบวนการ *
            </label>
            <input
              type="text"
              value={form.processCode}
              onChange={(e) => setForm({ ...form, processCode: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              placeholder="เช่น WELDING"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ชื่อกระบวนการ *
            </label>
            <input
              type="text"
              value={form.processName}
              onChange={(e) => setForm({ ...form, processName: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ลำดับ (sequence_order) *
            </label>
            <input
              type="number"
              min={1}
              value={form.sequenceOrder}
              onChange={(e) => setForm({ ...form, sequenceOrder: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              แผนกที่อนุญาต (คั่นด้วย comma)
            </label>
            <input
              type="text"
              value={form.deptCodes}
              onChange={(e) => setForm({ ...form, deptCodes: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              placeholder="เช่น WELDING, WE — ว่าง = ไม่จำกัดแผนก"
            />
            {departments.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                แผนกในระบบ: {departments.map((d) => d.code).join(", ")}
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            เปิดใช้งาน
          </label>
          <div className="flex gap-2 pt-2">
            <ActionButton type="submit" className="flex-1">
              บันทึก
            </ActionButton>
            <ActionButton
              variant="secondary"
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              ยกเลิก
            </ActionButton>
          </div>
        </form>
      </BaseModal>

      <BaseModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="ยืนยันการลบ"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            ยืนยันการลบกระบวนการผลิตนี้? (ถ้าถูกใช้งานจะปิดใช้งานแทน)
          </p>
          <div className="flex gap-2 pt-2">
            <ActionButton variant="danger" onClick={confirmDelete} className="flex-1">
              ลบ
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => setDeleteId(null)}
              className="flex-1"
            >
              ยกเลิก
            </ActionButton>
          </div>
        </div>
      </BaseModal>
    </PageContainer>
  );
}

export default function ProductionProcessesMasterPage() {
  return <PageContent />;
}
