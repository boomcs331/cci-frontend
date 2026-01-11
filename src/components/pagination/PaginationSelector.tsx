"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface PaginationSelectorProps {
  currentLimit: number;
}

export default function PaginationSelector({ currentLimit }: PaginationSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLimitChange = useCallback((newLimit: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    params.set('limit', newLimit);
    router.push(`/pc?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="mb-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">แสดง</span>
        <select
          value={currentLimit}
          onChange={(e) => handleLimitChange(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <span className="text-sm text-gray-700 dark:text-gray-300">รายการ</span>
      </div>
    </div>
  );
}