"use client";

import React, { useMemo } from "react";
import type { AuthPermission } from "@/services/authRbacService";
import { moduleLabelTh, permissionLabelTh } from "@/utils/permissionLabels";

type Props = {
  permissions: AuthPermission[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

const MODULE_ORDER = [
  "pc",
  "production",
  "stock",
  "production_plans",
  "production_orders",
  "products",
  "system",
];

function groupByModule(permissions: AuthPermission[]): Map<string, AuthPermission[]> {
  const map = new Map<string, AuthPermission[]>();
  const sorted = [...permissions].sort((a, b) => {
    const ai = MODULE_ORDER.indexOf(a.module);
    const bi = MODULE_ORDER.indexOf(b.module);
    const aRank = ai === -1 ? 99 : ai;
    const bRank = bi === -1 ? 99 : bi;
    if (aRank !== bRank) return aRank - bRank;
    const mod = a.module.localeCompare(b.module);
    if (mod !== 0) return mod;
    return a.code.localeCompare(b.code);
  });
  for (const p of sorted) {
    const list = map.get(p.module) ?? [];
    list.push(p);
    map.set(p.module, list);
  }
  return map;
}

export default function RolePermissionEditor({
  permissions,
  selectedIds,
  onChange,
  disabled = false,
}: Props) {
  const grouped = useMemo(() => groupByModule(permissions), [permissions]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleOne = (id: string, checked: boolean) => {
    if (disabled) return;
    if (checked) {
      if (!selectedSet.has(id)) onChange([...selectedIds, id]);
    } else {
      onChange(selectedIds.filter((x) => x !== id));
    }
  };

  const toggleModule = (modulePerms: AuthPermission[], selectAll: boolean) => {
    if (disabled) return;
    const moduleIds = modulePerms.map((p) => p.id);
    if (selectAll) {
      const merged = new Set([...selectedIds, ...moduleIds]);
      onChange([...merged]);
    } else {
      const remove = new Set(moduleIds);
      onChange(selectedIds.filter((id) => !remove.has(id)));
    }
  };

  if (permissions.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
        ไม่พบรายการ Permission ในระบบ
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([module, modulePerms]) => {
        const moduleIds = modulePerms.map((p) => p.id);
        const selectedInModule = moduleIds.filter((id) => selectedSet.has(id)).length;
        const allSelected = selectedInModule === moduleIds.length;
        const someSelected = selectedInModule > 0 && !allSelected;

        return (
          <section
            key={module}
            className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {moduleLabelTh(module)}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedInModule}/{moduleIds.length} สิทธิ์ที่เลือก
                </p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleModule(modulePerms, !allSelected)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400"
              >
                {allSelected ? "ยกเลิกทั้งหมด" : someSelected ? "เลือกทั้งหมด" : "เลือกทั้งหมด"}
              </button>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {modulePerms.map((perm) => (
                <li key={perm.id}>
                  <label className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/50 has-[:disabled]:cursor-not-allowed">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedSet.has(perm.id)}
                      disabled={disabled}
                      onChange={(e) => toggleOne(perm.id, e.target.checked)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-gray-900 dark:text-white text-sm">
                        {permissionLabelTh(perm.code, perm.name)}
                      </span>
                      {perm.description ? (
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {perm.description}
                        </span>
                      ) : null}
                      <span className="inline-block mt-1 text-[11px] font-mono text-gray-400 dark:text-gray-500">
                        {perm.code}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
