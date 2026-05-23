"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { ADMIN_ROLE_CODE } from "@/constants/permissions";
import {
  getSession,
  isSessionValid,
  type SessionData,
} from "@/utils/session";
import { sessionDisplayName } from "@/utils/resolveStoredUserLabel";

type TabKey = "user" | "status";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3 text-sm">
      <span className="font-medium text-gray-600 dark:text-gray-400 sm:w-36 shrink-0">
        {label}
      </span>
      <span className="text-gray-900 dark:text-white break-all">{value ?? "—"}</span>
    </div>
  );
}

export default function SessionPage() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("user");

  useEffect(() => {
    setSessionData(getSession());
    setLoading(false);
  }, []);

  const user = sessionData?.user;
  const displayName = useMemo(() => sessionDisplayName(user), [user]);
  const allDepts = useMemo(() => {
    if (user?.departments?.length) return user.departments;
    if (user?.department) return [user.department];
    return [];
  }, [user]);
  const deptCode = user?.department?.code ?? null;
  const allDeptCodes = allDepts
    .map((d) => d.code)
    .filter((c): c is string => Boolean(c?.trim()));
  const activeDeptId = sessionData?.activeDepartmentId ?? user?.departmentId ?? null;
  const permissions = sessionData?.permissions ?? [];
  const admin =
    user?.roles?.some((r) => r.code === ADMIN_ROLE_CODE) ?? false;
  const valid = sessionData ? isSessionValid() : false;

  const tabClass = (key: TabKey) =>
    key === tab
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="ข้อมูล Session" />
        <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div>
        <PageBreadcrumb pageTitle="ข้อมูล Session" />
        <ComponentCard title="ไม่พบ Session">
          <p className="text-center py-8 text-gray-500">กรุณาเข้าสู่ระบบใหม่</p>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="ข้อมูล Session" />
      <div className="space-y-6">
        <ComponentCard title="ข้อมูลจากการล็อกอิน">
          <div className="mb-6 flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900 w-full max-w-md">
            <button
              type="button"
              onClick={() => setTab("user")}
              className={`px-4 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${tabClass("user")}`}
            >
              ผู้ใช้
            </button>
            <button
              type="button"
              onClick={() => setTab("status")}
              className={`px-4 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${tabClass("status")}`}
            >
              สถานะ
            </button>
          </div>

          {tab === "user" ? (
            <div className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <InfoRow label="ชื่อแสดง" value={displayName || user?.username} />
              <InfoRow label="Username (login)" value={user?.username} />
              <InfoRow label="อีเมล" value={user?.email} />
              <InfoRow label="รหัสผู้ใช้" value={user?.id} />
              <InfoRow
                label="ชื่อ-นามสกุล"
                value={
                  [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "—"
                }
              />
              <InfoRow
                label="แผนกที่ใช้งาน"
                value={
                  user?.department?.code
                    ? `${user.department.code}${user.department.name ? ` — ${user.department.name}` : ""}`
                    : deptCode ?? "—"
                }
              />
              <InfoRow
                label="แผนกทั้งหมด"
                value={
                  allDepts.length
                    ? allDepts
                        .map((d) => {
                          const primary =
                            String(d.id) === String(activeDeptId) ? " (ใช้งาน)" : "";
                          return `${d.code ?? d.id}${d.name ? ` — ${d.name}` : ""}${primary}`;
                        })
                        .join(", ")
                    : allDeptCodes.join(", ") || "—"
                }
              />
              <InfoRow
                label="บทบาท (Roles)"
                value={
                  user?.roles?.length
                    ? user.roles
                        .map((r) => `${r.code ?? r.id}${r.name ? ` (${r.name})` : ""}`)
                        .join(", ")
                    : "—"
                }
              />
            </div>
          ) : (
            <div className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <InfoRow
                label="สถานะ Session"
                value={
                  valid ? (
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                      ใช้งานได้
                    </span>
                  ) : (
                    <span className="text-red-700 dark:text-red-300 font-medium">หมดอายุ</span>
                  )
                }
              />
              <InfoRow
                label="บัญชีใช้งาน"
                value={
                  user?.isActive === false ? (
                    <span className="text-amber-700 dark:text-amber-300">Inactive</span>
                  ) : (
                    <span className="text-emerald-700 dark:text-emerald-300">Active</span>
                  )
                }
              />
              <InfoRow label="สิทธิ์ Admin" value={admin ? "ใช่ (ADMIN_GLOBAL)" : "ไม่"} />
              <InfoRow label="จำนวนสิทธิ์" value={String(permissions.length)} />
              <InfoRow label="จำนวนเมนู" value={String(sessionData.menus?.length ?? 0)} />
              <InfoRow
                label="หมดอายุ Session"
                value={
                  sessionData.expiresAt
                    ? new Date(sessionData.expiresAt).toLocaleString("th-TH")
                    : "—"
                }
              />
              <InfoRow
                label="Token"
                value={
                  sessionData.token
                    ? `${sessionData.token.substring(0, 24)}…`
                    : "—"
                }
              />
            </div>
          )}

          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400">
              Raw JSON (debug)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-64">
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </details>
        </ComponentCard>
      </div>
    </div>
  );
}
