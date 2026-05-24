"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import {
  createAuthDepartment,
  deleteAuthDepartment,
  fetchAuthDepartments,
  updateAuthDepartment,
  type AuthDepartment,
  type DepartmentForm,
} from "@/services/authRbacService";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

const ITEMS_PER_PAGE = 10;
const emptyForm: DepartmentForm = { code: "", name: "", description: "" };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<AuthDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selected, setSelected] = useState<AuthDepartment | null>(null);
  const [formData, setFormData] = useState<DepartmentForm>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      setDepartments(await fetchAuthDepartments());
    } catch (e) {
      setAlert({
        variant: "error",
        title: "โหลดไม่สำเร็จ",
        message: e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
      });
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 4000);
    return () => clearTimeout(t);
  }, [alert]);

  useEffect(() => {
    const modalOpen = showAddModal || showEditModal || showDeleteModal;
    document.body.style.overflow = modalOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAddModal, showEditModal, showDeleteModal]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        (d.description?.toLowerCase().includes(q) ?? false),
    );
  }, [departments, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const openAdd = () => {
    setFormData(emptyForm);
    setShowAddModal(true);
  };

  const openEdit = (dept: AuthDepartment) => {
    setSelected(dept);
    setFormData({
      code: dept.code,
      name: dept.name,
      description: dept.description ?? "",
    });
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  const openDelete = (dept: AuthDepartment) => {
    setSelected(dept);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (showEditModal && selected) {
        await updateAuthDepartment(selected.id, formData);
        setAlert({ variant: "success", title: "สำเร็จ", message: "แก้ไขแผนกเรียบร้อยแล้ว" });
        setShowEditModal(false);
      } else {
        await createAuthDepartment(formData);
        setAlert({ variant: "success", title: "สำเร็จ", message: "เพิ่มแผนกเรียบร้อยแล้ว" });
        setShowAddModal(false);
      }
      await loadDepartments();
    } catch (err) {
      setAlert({
        variant: "error",
        title: "เกิดข้อผิดพลาด",
        message: err instanceof Error ? err.message : "ไม่สามารถบันทึกได้",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selected) return;
    setFormLoading(true);
    try {
      await deleteAuthDepartment(selected.id);
      setShowDeleteModal(false);
      setAlert({ variant: "success", title: "สำเร็จ", message: "ลบแผนกเรียบร้อยแล้ว" });
      await loadDepartments();
    } catch (err) {
      setAlert({
        variant: "error",
        title: "ลบไม่สำเร็จ",
        message: err instanceof Error ? err.message : "แผนกอาจถูกใช้งานอยู่ในระบบ",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="จัดการแผนก" />

      {alert ? (
        <div className="mb-4">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <Link href="/users" className="text-blue-600 hover:underline dark:text-blue-400">
          ผู้ใช้งาน
        </Link>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <Link
          href="/users/role-permissions"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          กำหนดสิทธิ์ Role
        </Link>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                แผนกในระบบ
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                รหัสแผนก (code) ใช้ในเมนู สิทธิ์ และการสลับแผนกของผู้ใช้
              </p>
            </div>
            <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700">
              เพิ่มแผนก
            </Button>
          </div>
        </div>

        <ComponentCard title={`รายการแผนก (${filtered.length})`}>
          <div className="mb-6">
            <input
              type="search"
              placeholder="ค้นหา code, ชื่อ, คำอธิบาย..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-1/3 h-11 px-4 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          {loading ? (
            <p className="text-center py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      รหัส (Code)
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      ชื่อแผนก
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      คำอธิบาย
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      อัปเดตล่าสุด
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white w-24">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginated.length === 0 ? (
                    <TableEmptyRow colSpan={5} />
                  ) : (
                    paginated.map((dept) => (
                      <tr
                        key={dept.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/80"
                      >
                        <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900 dark:text-white">
                          {dept.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {dept.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {dept.description || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(dept.updatedAt ?? dept.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenDropdown(openDropdown === dept.id ? null : dept.id)
                            }
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="เมนูจัดการ"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {openDropdown === dept.id ? (
                            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                              <button
                                type="button"
                                onClick={() => openEdit(dept)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                แก้ไข
                              </button>
                              <button
                                type="button"
                                onClick={() => openDelete(dept)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                ลบ
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > ITEMS_PER_PAGE ? (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">
                แสดง {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}{" "}
                จาก {filtered.length}
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          ) : null}
        </ComponentCard>
      </div>

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {showAddModal ? "เพิ่มแผนก" : "แก้ไขแผนก"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  รหัสแผนก (Code) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="เช่น WE, WELDING"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ชื่อแผนก *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selected ? (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              ยืนยันการลบแผนก
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              ต้องการลบแผนก <strong>{selected.name}</strong> ({selected.code}) หรือไม่?
              หากมีผู้ใช้หรือข้อมูลอ้างอิงอยู่ การลบจะไม่สำเร็จ
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={formLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {formLoading ? "กำลังลบ..." : "ลบ"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
