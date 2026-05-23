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
