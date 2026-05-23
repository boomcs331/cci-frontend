"use client";

import React, { useEffect, useState } from "react";
import { useClientHydrated } from "@/hooks/useClientHydrated";
import type { SessionDepartment } from "@/utils/session";
import {
  getActiveDepartmentId,
  getUserDepartments,
  SESSION_UPDATED_EVENT,
  confirmActiveDepartment,
} from "@/utils/session";

export default function DepartmentSwitcher() {
  const hydrated = useClientHydrated();
  const [departments, setDepartments] = useState<SessionDepartment[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (!hydrated) return;

    const refresh = () => {
      const depts = getUserDepartments();
      setDepartments(depts);
      setActiveId(getActiveDepartmentId() ?? String(depts[0]?.id ?? ""));
    };

    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(SESSION_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(SESSION_UPDATED_EVENT, onUpdate);
  }, [hydrated]);

  if (!hydrated || departments.length <= 1) {
    return null;
  }

  const value =
    activeId && departments.some((d) => String(d.id) === activeId)
      ? activeId
      : String(departments[0].id);

  return (
    <label className="hidden sm:flex items-center gap-2 text-theme-sm text-gray-600 dark:text-gray-400">
      <span className="whitespace-nowrap">แผนก</span>
      <select
        value={value}
        onChange={(e) => {
          confirmActiveDepartment(e.target.value);
        }}
        className="max-w-[160px] truncate rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        aria-label="เลือกแผนกที่ใช้งาน"
      >
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.code ?? d.name ?? d.id}
          </option>
        ))}
      </select>
    </label>
  );
}
