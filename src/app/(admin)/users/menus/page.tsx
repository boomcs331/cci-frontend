"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import type { MenuItem } from "@/types/user";
import { apiFetch } from "@/utils/api";
import { getSession, setSession } from "@/utils/session";
import React, { useEffect, useMemo, useState } from "react";

type MenuRecord = {
  id: string;
  code: string;
  label: string;
  path?: string | null;
  iconKey?: string | null;
  sortOrder: number;
  isActive: boolean;
  isCollapsible: boolean;
  adminOnly: boolean;
  permissionCodes?: string[] | null;
  permissionMatch: "all" | "any";
  allowedDepartments?: string[] | null;
  parentId?: string | null;
};

type MenuForm = {
  code: string;
  label: string;
  path: string;
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
  isCollapsible: boolean;
  adminOnly: boolean;
  permissionCodesText: string;
  permissionMatch: "all" | "any";
  allowedDepartmentsText: string;
  parentId: string;
};

const defaultForm: MenuForm = {
  code: "",
  label: "",
  path: "",
  iconKey: "",
  sortOrder: 0,
  isActive: true,
  isCollapsible: false,
  adminOnly: false,
  permissionCodesText: "",
  permissionMatch: "all",
  allowedDepartmentsText: "",
  parentId: "",
};

export default function MenusPage() {
  const [menus, setMenus] = useState<MenuRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuRecord | null>(null);
  const [form, setForm] = useState<MenuForm>(defaultForm);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    void fetchMenus();
  }, []);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 3000);
    return () => clearTimeout(timer);
  }, [alert]);

  const filteredMenus = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return menus;
    return menus.filter((menu) => {
      return (
        menu.code.toLowerCase().includes(keyword) ||
        menu.label.toLowerCase().includes(keyword) ||
        (menu.path ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [menus, search]);

  const parentOptions = useMemo(
    () =>
      menus
        .filter((menu) => !editingMenu || menu.id !== editingMenu.id)
        .map((menu) => ({ id: menu.id, label: `${menu.label} (${menu.code})` })),
    [menus, editingMenu],
  );

  const fetchMenus = async () => {
    try {
      const response = await apiFetch("/auth/menus");
      if (!response.ok) {
        throw new Error("Failed to fetch menus");
      }
      const data = (await response.json()) as { menus?: MenuRecord[] };
      setMenus(data.menus ?? []);
    } catch {
      setAlert({
        variant: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถดึงข้อมูลเมนูได้",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncSessionMenus = async () => {
    const session = getSession();
    if (!session?.user?.id) {
      return;
    }

    const headers: HeadersInit = {
      "x-user-id": session.user.id,
    };
    const departmentId = session.user.departmentId ?? session.user.department?.id;
    if (departmentId) {
      headers["x-department-id"] = departmentId;
    }

    const response = await apiFetch("/auth/menu", { headers });
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as { menus?: MenuItem[] };
    if (Array.isArray(data.menus)) {
      setSession({
        ...session,
        menus: data.menus,
      });
    }
  };

  const openAddModal = () => {
    setEditingMenu(null);
    setForm(defaultForm);
    setOpenModal(true);
  };

  const openEditModal = (menu: MenuRecord) => {
    setEditingMenu(menu);
    setForm({
      code: menu.code,
      label: menu.label,
      path: menu.path ?? "",
      iconKey: menu.iconKey ?? "",
      sortOrder: menu.sortOrder,
      isActive: menu.isActive,
      isCollapsible: menu.isCollapsible,
      adminOnly: menu.adminOnly,
      permissionCodesText: (menu.permissionCodes ?? []).join(", "),
      permissionMatch: menu.permissionMatch,
      allowedDepartmentsText: (menu.allowedDepartments ?? []).join(", "),
      parentId: menu.parentId ?? "",
    });
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditingMenu(null);
    setForm(defaultForm);
  };

  const parseCommaSeparated = (value: string): string[] | null => {
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length > 0 ? items : null;
  };

  const buildPayload = () => {
    return {
      code: form.code.trim(),
      label: form.label.trim(),
      path: form.path.trim() || null,
      iconKey: form.iconKey.trim() || null,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
      isCollapsible: form.isCollapsible,
      adminOnly: form.adminOnly,
      permissionCodes: parseCommaSeparated(form.permissionCodesText),
      permissionMatch: form.permissionMatch,
      allowedDepartments: parseCommaSeparated(form.allowedDepartmentsText),
      parentId: form.parentId || null,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const url = editingMenu
        ? `/auth/menus/${editingMenu.id}`
        : "/auth/menus";
      const method = editingMenu ? "PUT" : "POST";
      const response = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || "Operation failed");
      }

      await fetchMenus();
      await syncSessionMenus();
      closeModal();
      setAlert({
        variant: "success",
        title: "สำเร็จ",
        message: data.message || (editingMenu ? "อัปเดตเมนูเรียบร้อยแล้ว" : "เพิ่มเมนูเรียบร้อยแล้ว"),
      });
    } catch (error) {
      setAlert({
        variant: "error",
        title: "เกิดข้อผิดพลาด",
        message: error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลเมนูได้",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (menu: MenuRecord) => {
    const confirmed = window.confirm(`ยืนยันลบเมนู "${menu.label}" ?`);
    if (!confirmed) return;

    try {
      const response = await apiFetch(`/auth/menus/${menu.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Delete failed");
      }
      await fetchMenus();
      await syncSessionMenus();
      setAlert({
        variant: "success",
        title: "สำเร็จ",
        message: "ลบเมนูเรียบร้อยแล้ว",
      });
    } catch {
      setAlert({
        variant: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถลบเมนูได้",
      });
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Menus Management" />
      {alert && (
        <div className="mb-4">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">จัดการเมนูจากฐานข้อมูล</h2>
            <Button onClick={openAddModal}>เพิ่มเมนู</Button>
          </div>
        </div>

        <ComponentCard title={`All Menus (${filteredMenus.length})`}>
          <div className="mb-5">
            <input
              type="text"
              placeholder="ค้นหา code, label, path..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full md:w-1/3 h-11 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Label</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Path</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Parent</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Sort</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMenus.map((menu) => (
                    <tr key={menu.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{menu.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{menu.label}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{menu.path || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{menu.parentId || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{menu.sortOrder}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {menu.isActive ? "Active" : "Inactive"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(menu)}
                            className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(menu)}
                            className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredMenus.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        No menus found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>
      </div>

      {openModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingMenu ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Code"
                  value={form.code}
                  onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                />
                <input
                  required
                  placeholder="Label"
                  value={form.label}
                  onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                />
                <input
                  placeholder="Path (/users/menus)"
                  value={form.path}
                  onChange={(event) => setForm((prev) => ({ ...prev, path: event.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                />
                <input
                  placeholder="Icon key (users, gauge, ...)"
                  value={form.iconKey}
                  onChange={(event) => setForm((prev) => ({ ...prev, iconKey: event.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Sort order"
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                />
                <select
                  value={form.parentId}
                  onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                >
                  <option value="">No parent</option>
                  {parentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  placeholder="Permission codes (comma separated)"
                  value={form.permissionCodesText}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, permissionCodesText: event.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                />
                <input
                  placeholder="Allowed departments (WE,PD)"
                  value={form.allowedDepartmentsText}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, allowedDepartmentsText: event.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={form.permissionMatch}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      permissionMatch: event.target.value as "all" | "any",
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                >
                  <option value="all">Permission Match: all</option>
                  <option value="any">Permission Match: any</option>
                </select>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                      }
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isCollapsible}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, isCollapsible: event.target.checked }))
                      }
                    />
                    Collapsible
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.adminOnly}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, adminOnly: event.target.checked }))
                      }
                    />
                    Admin only
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg"
                >
                  {saving ? "กำลังบันทึก..." : editingMenu ? "บันทึกการแก้ไข" : "เพิ่มเมนู"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2.5 rounded-lg"
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
