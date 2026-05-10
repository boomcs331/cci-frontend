"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import { apiFetch } from "@/utils/api";
import React, { useEffect, useMemo, useState } from "react";

type RoleScopeType = "GLOBAL" | "DEPARTMENT";

type Role = {
  id: string;
  code: string;
  name: string;
  scopeType: RoleScopeType;
};

type Department = {
  id: string;
  code: string;
  name: string;
};

type UserRoleAssignment = {
  roleId: string;
  departmentId?: string | null;
  role?: { id: string; code: string; name: string; scopeType: RoleScopeType };
};

type User = {
  id: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  departmentId?: string | null;
  isActive: boolean;
  roles: Role[];
  roleAssignments?: UserRoleAssignment[];
  createdAt: string;
  updatedAt: string;
};

type UserForm = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  roleIds: string[];
  scopedDepartmentByRole: Record<string, string>;
};

const PROTECTED_USERNAMES = new Set(["admin.global"]);
const ITEMS_PER_PAGE = 10;

const defaultForm: UserForm = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  departmentId: "",
  roleIds: [],
  scopedDepartmentByRole: {},
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(defaultForm);
  const [alert, setAlert] = useState<{
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    void Promise.all([fetchUsers(), fetchRoles(), fetchDepartments()]).finally(() =>
      setLoading(false),
    );
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 3000);
    return () => clearTimeout(timer);
  }, [alert]);

  const roleById = useMemo(() => {
    return new Map(roles.map((role) => [role.id, role]));
  }, [roles]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        keyword.length === 0 ||
        user.username.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  const departmentRoleIds = useMemo(() => {
    return roles.filter((role) => role.scopeType === "DEPARTMENT").map((role) => role.id);
  }, [roles]);

  const fetchUsers = async () => {
    const response = await apiFetch("/auth/users");
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    const data = (await response.json()) as { users?: User[] };
    setUsers(data.users ?? []);
  };

  const fetchRoles = async () => {
    const response = await apiFetch("/auth/roles");
    if (!response.ok) {
      throw new Error("Failed to fetch roles");
    }
    const data = (await response.json()) as { roles?: Role[] };
    setRoles(data.roles ?? []);
  };

  const fetchDepartments = async () => {
    const response = await apiFetch("/auth/departments");
    if (!response.ok) {
      throw new Error("Failed to fetch departments");
    }
    const data = (await response.json()) as { departments?: Department[] };
    setDepartments(data.departments ?? []);
  };

  const fetchUserDetail = async (userId: string): Promise<User> => {
    const response = await apiFetch(`/auth/users/${userId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch user detail");
    }
    return (await response.json()) as User;
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(defaultForm);
    setOpenModal(true);
  };

  const openEditModal = async (user: User) => {
    setSaving(true);
    try {
      const detail = await fetchUserDetail(user.id);
      const scopedDepartmentByRole: Record<string, string> = {};
      for (const assignment of detail.roleAssignments ?? []) {
        if (assignment.departmentId) {
          scopedDepartmentByRole[assignment.roleId] = assignment.departmentId;
        }
      }

      setEditingUser(detail);
      setForm({
        username: detail.username,
        email: detail.email,
        password: "",
        firstName: detail.firstName ?? "",
        lastName: detail.lastName ?? "",
        departmentId: detail.departmentId ?? "",
        roleIds: [
          ...new Set([
            ...detail.roles.map((role) => role.id),
            ...(detail.roleAssignments ?? []).map((assignment) => assignment.roleId),
          ]),
        ],
        scopedDepartmentByRole,
      });
      setOpenModal(true);
    } catch {
      setAlert({
        variant: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถโหลดข้อมูลผู้ใช้สำหรับแก้ไขได้",
      });
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditingUser(null);
    setForm(defaultForm);
  };

  const toggleRole = (roleId: string) => {
    setForm((prev) => {
      if (prev.roleIds.includes(roleId)) {
        const nextScoped = { ...prev.scopedDepartmentByRole };
        delete nextScoped[roleId];
        return {
          ...prev,
          roleIds: prev.roleIds.filter((id) => id !== roleId),
          scopedDepartmentByRole: nextScoped,
        };
      }
      return { ...prev, roleIds: [...prev.roleIds, roleId] };
    });
  };

  const setScopedDepartment = (roleId: string, departmentId: string) => {
    setForm((prev) => ({
      ...prev,
      scopedDepartmentByRole: {
        ...prev.scopedDepartmentByRole,
        [roleId]: departmentId,
      },
    }));
  };

  const validateScopedAssignments = (): string | null => {
    for (const roleId of form.roleIds) {
      if (!departmentRoleIds.includes(roleId)) continue;
      const scopedDepartment = form.scopedDepartmentByRole[roleId] || form.departmentId;
      if (!scopedDepartment) {
        const role = roleById.get(roleId);
        return `กรุณาเลือกแผนกสำหรับ role ${role?.code ?? roleId}`;
      }
    }
    return null;
  };

  const buildScopedAssignments = () => {
    return form.roleIds
      .filter((roleId) => departmentRoleIds.includes(roleId))
      .map((roleId) => ({
        roleId,
        departmentId: form.scopedDepartmentByRole[roleId] || form.departmentId,
      }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const scopedValidationError = validateScopedAssignments();
    if (scopedValidationError) {
      setAlert({
        variant: "warning",
        title: "ข้อมูลไม่ครบ",
        message: scopedValidationError,
      });
      return;
    }

    setSaving(true);
    try {
      const globalRoleIds = form.roleIds.filter((roleId) => !departmentRoleIds.includes(roleId));
      const scopedAssignments = buildScopedAssignments();

      if (editingUser) {
        const updateResponse = await apiFetch(`/auth/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username.trim(),
            email: form.email.trim(),
            firstName: form.firstName.trim() || null,
            lastName: form.lastName.trim() || null,
            departmentId: form.departmentId || null,
            roleIds: globalRoleIds,
          }),
        });

        if (!updateResponse.ok) {
          const err = (await updateResponse.json().catch(() => ({}))) as { message?: string };
          throw new Error(err.message || "Update failed");
        }

        const scopedResponse = await apiFetch(`/auth/users/${editingUser.id}/scoped-roles`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignments: scopedAssignments }),
        });

        if (!scopedResponse.ok) {
          const err = (await scopedResponse.json().catch(() => ({}))) as { message?: string };
          throw new Error(err.message || "Scoped role update failed");
        }
      } else {
        const createResponse = await apiFetch("/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
            firstName: form.firstName.trim() || undefined,
            lastName: form.lastName.trim() || undefined,
            departmentId: form.departmentId || undefined,
            roleIds: globalRoleIds,
          }),
        });

        if (!createResponse.ok) {
          const err = (await createResponse.json().catch(() => ({}))) as { message?: string };
          throw new Error(err.message || "Create failed");
        }

        const created = (await createResponse.json()) as { user?: User };
        const createdUserId = created.user?.id;
        if (createdUserId && scopedAssignments.length > 0) {
          const scopedResponse = await apiFetch(`/auth/users/${createdUserId}/scoped-roles`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignments: scopedAssignments }),
          });

          if (!scopedResponse.ok) {
            const err = (await scopedResponse.json().catch(() => ({}))) as { message?: string };
            throw new Error(err.message || "Scoped role assignment failed");
          }
        }
      }

      await fetchUsers();
      closeModal();
      setAlert({
        variant: "success",
        title: "สำเร็จ",
        message: editingUser ? "อัปเดตผู้ใช้เรียบร้อยแล้ว" : "สร้างผู้ใช้เรียบร้อยแล้ว",
      });
    } catch (error) {
      setAlert({
        variant: "error",
        title: "เกิดข้อผิดพลาด",
        message: error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลผู้ใช้ได้",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (PROTECTED_USERNAMES.has(user.username)) {
      setAlert({
        variant: "warning",
        title: "ป้องกันความปลอดภัย",
        message: "ไม่อนุญาตให้ปิดใช้งาน admin.global",
      });
      return;
    }

    try {
      const response = await apiFetch(`/auth/users/${user.id}/toggle-status`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Toggle status failed");
      }
      await fetchUsers();
    } catch {
      setAlert({
        variant: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้",
      });
    }
  };

  const handleDelete = async (user: User) => {
    if (PROTECTED_USERNAMES.has(user.username)) {
      setAlert({
        variant: "warning",
        title: "ป้องกันความปลอดภัย",
        message: "ไม่อนุญาตให้ลบ admin.global",
      });
      return;
    }

    const ok = window.confirm(`ยืนยันลบผู้ใช้ ${user.username} ?`);
    if (!ok) return;

    try {
      const response = await apiFetch(`/auth/users/${user.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Delete failed");
      }
      await fetchUsers();
      setAlert({
        variant: "success",
        title: "สำเร็จ",
        message: "ลบผู้ใช้เรียบร้อยแล้ว",
      });
    } catch {
      setAlert({
        variant: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถลบผู้ใช้ได้",
      });
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Users Management" />
      {alert && (
        <div className="mb-4">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Manage Users</h2>
            <Button onClick={openCreateModal}>เพิ่มผู้ใช้งาน</Button>
          </div>
        </div>

        <ComponentCard title={`Users (${filteredUsers.length})`}>
          <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหา username/email/name..."
              className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
              className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button
              className="h-11 bg-gray-500 hover:bg-gray-600"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              ล้างตัวกรอง
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      Roles
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedUsers.map((user) => {
                    const isProtected = PROTECTED_USERNAMES.has(user.username);
                    return (
                      <tr key={user.id}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{user.username}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {user.roles.length > 0 ? user.roles.map((role) => role.code).join(", ") : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              user.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              disabled={isProtected}
                              className="px-3 py-1 text-xs rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Toggle
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              disabled={isProtected}
                              className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {filteredUsers.length > ITEMS_PER_PAGE && (
            <div className="flex justify-end pt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </ComponentCard>
      </div>

      {openModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm animate-cci-backdrop-in flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-cci-popup animate-cci-modal-in p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingUser ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งาน"}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Username"
                  value={form.username}
                  onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                />
                {!editingUser && (
                  <input
                    required
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                  />
                )}
                <input
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                />
                <input
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                />
                <select
                  value={form.departmentId}
                  onChange={(event) => setForm((prev) => ({ ...prev, departmentId: event.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900"
                >
                  <option value="">No Department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.code} - {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Roles</p>
                <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2">
                  {roles.map((role) => (
                    <div key={role.id} className="space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.roleIds.includes(role.id)}
                          onChange={() => toggleRole(role.id)}
                        />
                        <span>
                          {role.name} ({role.code}) [{role.scopeType}]
                        </span>
                      </label>
                      {form.roleIds.includes(role.id) && role.scopeType === "DEPARTMENT" && (
                        <div className="pl-6">
                          <select
                            value={form.scopedDepartmentByRole[role.id] || form.departmentId || ""}
                            onChange={(event) => setScopedDepartment(role.id, event.target.value)}
                            className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-900 text-sm"
                          >
                            <option value="">เลือกแผนกสำหรับ role นี้</option>
                            {departments.map((department) => (
                              <option key={department.id} value={department.id}>
                                {department.code} - {department.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg"
                >
                  {saving ? "กำลังบันทึก..." : editingUser ? "บันทึกการแก้ไข" : "เพิ่มผู้ใช้"}
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
