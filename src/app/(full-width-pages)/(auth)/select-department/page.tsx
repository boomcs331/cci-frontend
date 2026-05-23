"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useClientHydrated } from "@/hooks/useClientHydrated";
import {
  confirmActiveDepartment,
  getSession,
  getUserDepartments,
  isSessionValid,
  needsDepartmentSelection,
  type SessionDepartment,
} from "@/utils/session";
import { sessionDisplayName } from "@/utils/resolveStoredUserLabel";

export default function SelectDepartmentPage() {
  const router = useRouter();
  const hydrated = useClientHydrated();
  const [departments, setDepartments] = useState<SessionDepartment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    if (!isSessionValid()) {
      router.replace("/signin");
      return;
    }

    if (!needsDepartmentSelection()) {
      router.replace("/");
      return;
    }

    const session = getSession();
    const depts = getUserDepartments();
    setDepartments(depts);
    setDisplayName(sessionDisplayName(session?.user) || session?.user?.username || "");
    if (depts.length === 1) {
      setSelectedId(String(depts[0].id));
    }
  }, [hydrated, router]);

  const handleContinue = () => {
    if (!selectedId) {
      setError("กรุณาเลือกแผนกที่ต้องการใช้งาน");
      return;
    }
    setError(null);
    confirmActiveDepartment(selectedId);
    router.replace("/");
  };

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center w-full max-w-lg mx-auto p-6">
        <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-lg mx-auto p-6 sm:p-10">
        <div className="mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            เลือกแผนกที่ใช้งาน
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {displayName ? (
              <>
                สวัสดี <span className="font-medium text-gray-700 dark:text-gray-300">{displayName}</span>
                {" — "}
              </>
            ) : null}
            บัญชีของคุณสังกัดหลายแผนก กรุณาเลือกแผนกที่ต้องการทำงานในรอบนี้ก่อนเข้าสู่ระบบ
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert variant="error" title="ไม่สามารถดำเนินการต่อได้" message={error} />
          </div>
        )}

        <div className="space-y-3 mb-8" role="radiogroup" aria-label="เลือกแผนก">
          {departments.map((dept) => {
            const id = String(dept.id);
            const selected = selectedId === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSelectedId(id)}
                className={`w-full text-left rounded-xl border-2 px-4 py-4 transition-colors ${
                  selected
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-400"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
                }`}
              >
                <span className="block font-semibold text-gray-900 dark:text-white font-mono">
                  {dept.code ?? id}
                </span>
                {dept.name ? (
                  <span className="block text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {dept.name}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <Button
          className="w-full"
          size="sm"
          type="button"
          disabled={!selectedId}
          onClick={handleContinue}
        >
          เข้าสู่ระบบด้วยแผนกนี้
        </Button>

        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          สามารถเปลี่ยนแผนกได้ภายหลังจากเมนูด้านบน (ถ้ามีหลายแผนก)
        </p>
      </div>
    </div>
  );
}
