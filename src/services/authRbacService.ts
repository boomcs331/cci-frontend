import { apiFetch } from "@/utils/api";
import { parseApiErrorResponse } from "@/utils/apiErrorMessages";

export type AuthPermission = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  module: string;
};

export type AuthRole = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
  scopeType?: "GLOBAL" | "DEPARTMENT";
};

export type AuthRoleDetail = AuthRole & {
  permissions?: AuthPermission[];
};

function unwrapCollection<T>(
  data: unknown,
  keys: string[],
): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of keys) {
      const value = record[key];
      if (Array.isArray(value)) return value as T[];
    }
    if (Array.isArray(record.data)) return record.data as T[];
  }
  return [];
}

export async function fetchAuthPermissions(): Promise<AuthPermission[]> {
  const res = await apiFetch("/auth/permissions");
  if (!res.ok) {
    throw new Error(await parseApiErrorResponse(res, "โหลดรายการ Permission ไม่สำเร็จ"));
  }
  const data = await res.json();
  return unwrapCollection<AuthPermission>(data, ["permissions"]);
}

export async function fetchAuthRoles(): Promise<AuthRole[]> {
  const res = await apiFetch("/auth/roles");
  if (!res.ok) {
    throw new Error(await parseApiErrorResponse(res, "โหลดรายการ Role ไม่สำเร็จ"));
  }
  const data = await res.json();
  return unwrapCollection<AuthRole>(data, ["roles"]);
}

export async function fetchAuthRoleDetail(roleId: string): Promise<AuthRoleDetail> {
  const res = await apiFetch(`/auth/roles/${roleId}`);
  if (!res.ok) {
    throw new Error(await parseApiErrorResponse(res, "โหลดข้อมูล Role ไม่สำเร็จ"));
  }
  return (await res.json()) as AuthRoleDetail;
}

export async function assignRolePermissions(
  roleId: string,
  permissionIds: string[],
): Promise<void> {
  const res = await apiFetch(`/auth/roles/${roleId}/permissions`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissionIds }),
  });
  if (!res.ok) {
    throw new Error(await parseApiErrorResponse(res, "บันทึกสิทธิ์ไม่สำเร็จ"));
  }
}

export type AuthDepartment = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DepartmentForm = {
  code: string;
  name: string;
  description: string;
};

export async function fetchAuthDepartments(): Promise<AuthDepartment[]> {
  const res = await apiFetch("/auth/departments");
  if (!res.ok) {
    throw new Error(await parseApiErrorResponse(res, "โหลดรายการแผนกไม่สำเร็จ"));
  }
  const data = await res.json();
  return unwrapCollection<AuthDepartment>(data, ["departments"]);
}

export async function createAuthDepartment(form: DepartmentForm): Promise<void> {
  const res = await apiFetch("/auth/departments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
    }),
  });
  if (!res.ok) {
    throw new Error(await parseApiErrorResponse(res, "เพิ่มแผนกไม่สำเร็จ"));
  }
}

export async function updateAuthDepartment(
  id: string,
  form: DepartmentForm,
): Promise<void> {
  const res = await apiFetch(`/auth/departments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
    }),
  });
  if (!res.ok) {
    throw new Error(await parseApiErrorResponse(res, "แก้ไขแผนกไม่สำเร็จ"));
  }
}

export async function deleteAuthDepartment(id: string): Promise<void> {
  const res = await apiFetch(`/auth/departments/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await parseApiErrorResponse(res, "ลบแผนกไม่สำเร็จ"));
  }
}
