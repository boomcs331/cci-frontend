"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import RolePermissionEditor from "@/components/admin/RolePermissionEditor";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import {
  assignRolePermissions,
  fetchAuthPermissions,
  fetchAuthRoleDetail,
  fetchAuthRoles,
  type AuthRole,
} from "@/services/authRbacService";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export default function RolePermissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleIdFromUrl = searchParams.get("roleId");

  const [roles, setRoles] = useState<AuthRole[]>([]);
  const [permissions, setPermissions] = useState<Awaited<ReturnType<typeof fetchAuthPermissions>>>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(roleIdFromUrl);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const [alert, setAlert] = useState<{
    variant: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.description?.toLowerCase().includes(q) ?? false),
    );
  }, [roles, roleSearch]);

  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  const loadRolePermissions = useCallback(async (roleId: string) => {
    setRoleLoading(true);
    try {
      const detail = await fetchAuthRoleDetail(roleId);
      const ids = (detail.permissions ?? []).map((p) => p.id);
      setSelectedPermissionIds(ids);
      setDirty(false);
    } catch (e) {
      setAlert({
        variant: "error",
        title: "โหลดไม่สำเร็จ",
        message: e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
      });
    } finally {
      setRoleLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [roleList, permList] = await Promise.all([
          fetchAuthRoles(),
          fetchAuthPermissions(),
        ]);
        if (cancelled) return;
        setRoles(roleList);
        setPermissions(permList);

        const initialId =
          roleIdFromUrl && roleList.some((r) => r.id === roleIdFromUrl)
            ? roleIdFromUrl
            : roleList[0]?.id ?? null;
        setSelectedRoleId(initialId);
      } catch (e) {
        if (!cancelled) {
          setAlert({
            variant: "error",
            title: "โหลดข้อมูลไม่สำเร็จ",
            message: e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roleIdFromUrl]);

  useEffect(() => {
    if (!selectedRoleId) return;
    void loadRolePermissions(selectedRoleId);
  }, [selectedRoleId, loadRolePermissions]);

  const selectRole = (roleId: string) => {
    if (dirty && !window.confirm("มีการแก้ไขที่ยังไม่ได้บันทึก ต้องการเปลี่ยน Role หรือไม่?")) {
      return;
    }
    setSelectedRoleId(roleId);
    router.replace(`/users/role-permissions?roleId=${encodeURIComponent(roleId)}`, {
      scroll: false,
    });
  };

  const handlePermissionChange = (ids: string[]) => {
    setSelectedPermissionIds(ids);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      await assignRolePermissions(selectedRoleId, selectedPermissionIds);
      setDirty(false);
      setAlert({
        variant: "success",
        title: "บันทึกสำเร็จ",
        message: `อัปเดตสิทธิ์ของ Role "${selectedRole?.name ?? ""}" แล้ว`,
      });
    } catch (e) {
      setAlert({
        variant: "error",
        title: "บันทึกไม่สำเร็จ",
        message: e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="กำหนดสิทธิ์ Role" />

      {alert ? (
        <div className="mb-4">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/users/roles"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          จัดการข้อมูล Role
        </Link>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <Link
          href="/users/permissions"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          รายการ Permission
        </Link>
      </div>

      {loading ? (
        <ComponentCard title="กำลังโหลด...">
          <p className="text-gray-500 dark:text-gray-400 py-8 text-center">กำลังโหลดข้อมูล...</p>
        </ComponentCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <ComponentCard title={`เลือก Role (${filteredRoles.length})`}>
              <input
                type="search"
                placeholder="ค้นหา code / ชื่อ..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="w-full mb-4 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              />
              <ul className="space-y-1 max-h-[min(70vh,520px)] overflow-y-auto">
                {filteredRoles.map((role) => {
                  const active = role.id === selectedRoleId;
                  return (
                    <li key={role.id}>
                      <button
                        type="button"
                        onClick={() => selectRole(role.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          active
                            ? "bg-blue-600 text-white"
                            : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <span className="block font-medium">{role.name}</span>
                        <span
                          className={`block text-xs font-mono mt-0.5 ${
                            active ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {role.code}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </ComponentCard>
          </div>

          <div className="lg:col-span-8">
            <ComponentCard
              title={
                selectedRole
                  ? `สิทธิ์ของ Role: ${selectedRole.name}`
                  : "เลือก Role ทางซ้าย"
              }
            >
              {!selectedRole ? (
                <p className="text-gray-500 py-8 text-center">ยังไม่มี Role ในระบบ</p>
              ) : roleLoading ? (
                <p className="text-gray-500 py-8 text-center">กำลังโหลดสิทธิ์ของ Role...</p>
              ) : (
                <>
                  {selectedRole.description ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {selectedRole.description}
                    </p>
                  ) : null}
                  <RolePermissionEditor
                    permissions={permissions}
                    selectedIds={selectedPermissionIds}
                    onChange={handlePermissionChange}
                    disabled={saving}
                  />
                  <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || !dirty}
                    >
                      {saving ? "กำลังบันทึก..." : "บันทึกสิทธิ์"}
                    </Button>
                    {dirty ? (
                      <span className="text-sm text-amber-600 dark:text-amber-400">
                        มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">
                        เลือกแล้ว {selectedPermissionIds.length} สิทธิ์
                      </span>
                    )}
                  </div>
                </>
              )}
            </ComponentCard>
          </div>
        </div>
      )}
    </div>
  );
}
