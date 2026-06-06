"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer, PageHeader, ContentCard, BaseModal, ActionButton, LoadingState } from "@/components/shared";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import { apiFetch } from "@/utils/api";
import {
  createProductProductionStep,
  deleteProductProductionStep,
  getMasterProductionProcesses,
  listProductProductionSteps,
  updateProductProductionStep,
} from "@/services/productProductionStepsService";
import type {
  ProductProductionStepListRow,
  ProductionProcess,
} from "@/types/production";

interface ProductOption {
  id: number;
  productCode: string;
  productName: string;
}

const emptyForm = { productId: "", stepOrder: "1", processId: "" };

function PageContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const productIdFilter = searchParams.get("productId") || "";

  const [rows, setRows] = useState<ProductProductionStepListRow[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [processes, setProcesses] = useState<ProductionProcess[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProductProductionStepListRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listProductProductionSteps({
        page,
        limit,
        productId: productIdFilter ? parseInt(productIdFilter, 10) : undefined,
        search: search || undefined,
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
  }, [page, limit, productIdFilter, search]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      try {
        const [prodRes, procList] = await Promise.all([
          apiFetch("/products?page=1&limit=500"),
          getMasterProductionProcesses(),
        ]);
        if (cancelled) return;
        if (prodRes.ok) {
          const json = await prodRes.json();
          const list = (json.data || []) as ProductOption[];
          setProducts(list);
        }
        setProcesses(procList.filter((p) => p.isActive !== false));
      } catch {
        /* dropdowns optional */
      }
    };
    void loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      productId: productIdFilter || "",
      stepOrder: "1",
      processId: processes[0]?.id ? String(processes[0].id) : "",
    });
    setShowModal(true);
  };

  const openEdit = (row: ProductProductionStepListRow) => {
    setEditing(row);
    setForm({
      productId: String(row.productId),
      stepOrder: String(row.stepOrder),
      processId: String(row.processId),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productId = parseInt(form.productId, 10);
    const stepOrder = parseInt(form.stepOrder, 10);
    const processId = parseInt(form.processId, 10);
    if (!productId || !stepOrder || !processId) {
      setMessage({ type: "error", text: "กรุณากรอกข้อมูลให้ครบ" });
      return;
    }
    try {
      if (editing) {
        await updateProductProductionStep(editing.id, { stepOrder, processId });
        setMessage({ type: "success", text: "อัปเดตสำเร็จ" });
      } else {
        await createProductProductionStep({ productId, stepOrder, processId });
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
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProductProductionStep(deleteId);
      setMessage({ type: "success", text: "ลบสำเร็จ" });
      void fetchRows();
      setTimeout(() => setMessage(null), 3000);
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
        title="ขั้นตอนผลิตต่อสินค้า (Master)"
        description={`ทั้งหมด ${pagination?.total ?? 0} รายการ`}
        actions={
          <ActionButton
            variant="primary"
            onClick={openCreate}
          >
            เพิ่มขั้นตอน
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            จัดการลำดับขั้นตอนผลิตของแต่ละสินค้า (ต้องมี BOM ก่อนเพิ่มขั้นตอน) — หรือใช้{" "}
            <a href="/master-data/production-steps" className="text-blue-600 hover:underline">
              หน้าตั้งลำดับแบบรายสินค้า
            </a>
          </p>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <PaginationSelector currentLimit={limit} />
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
                  placeholder="ค้นหารหัสสินค้า / กระบวนการ"
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white min-w-[200px]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
                >
                  ค้นหา
                </button>
                {search ? (
                  <button
                    type="button"
                    className="px-3 py-1.5 text-sm text-gray-600"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                    }}
                  >
                    ล้าง
                  </button>
                ) : null}
              </form>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-max w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">
                    รหัสสินค้า
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">
                    ชื่อสินค้า
                  </th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 dark:text-white w-20">
                    ลำดับ
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">
                    กระบวนการ
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white w-28">
                    อัปเดตโดย
                  </th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 dark:text-white w-32">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {row.product?.productCode ?? row.productId}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {row.product?.productName ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-white">
                        {row.stepOrder}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {row.process
                          ? `${row.process.processCode} — ${row.process.processName}`
                          : row.processId}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {row.updateBy || row.createBy || "—"}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="flex gap-2 justify-center">
                          <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={() => openEdit(row)}
                          >
                            แก้ไข
                          </ActionButton>
                          <ActionButton
                            variant="danger"
                            size="sm"
                            onClick={() => void handleDelete(row.id)}
                          >
                            ลบ
                          </ActionButton>
                        </div>
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
        </ContentCard>

      <BaseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "แก้ไขขั้นตอนผลิต" : "เพิ่มขั้นตอนผลิต"}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              สินค้า *
            </label>
            <select
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              disabled={!!editing}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white disabled:opacity-60"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ลำดับขั้นตอน *
            </label>
            <input
              type="number"
              min={1}
              value={form.stepOrder}
              onChange={(e) => setForm({ ...form, stepOrder: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              กระบวนการผลิต *
            </label>
            <select
              value={form.processId}
              onChange={(e) => setForm({ ...form, processId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              required
            >
              <option value="">— เลือกกระบวนการ —</option>
              {processes.map((proc) => (
                <option key={proc.id} value={proc.id}>
                  {proc.processCode} — {proc.processName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-3">
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

      {deleteId !== null && (
        <BaseModal
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          title="ยืนยันการลบ"
          size="sm"
        >
          <div className="mb-6 text-gray-700 dark:text-gray-300">
            คุณต้องการลบขั้นตอนผลิตรายการนี้หรือไม่?
          </div>
          <div className="flex gap-3">
            <ActionButton
              variant="danger"
              onClick={confirmDelete}
              className="flex-1"
            >
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
        </BaseModal>
      )}
    </PageContainer>
  );
}

export default function ProductProductionStepsMasterPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">กำลังโหลด...</div>}>
      <PageContent />
    </Suspense>
  );
}
