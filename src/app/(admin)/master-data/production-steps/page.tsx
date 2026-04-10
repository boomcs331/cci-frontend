"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/master-data/PaginationFooter";
import { getApiUrl } from "@/utils/api";

export default function MasterDataProductionStepsPage() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(getApiUrl(`/products?page=${page}&limit=${limit}`));
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setProducts(data.data || []);
        setPagination(data.pagination);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [page, limit]);

  if (loading && products.length === 0) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Master Data - ลำดับขั้นตอนผลิต" />
        <ComponentCard title="ลำดับขั้นตอนผลิต">
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">กำลังโหลด...</div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Master Data - ลำดับขั้นตอนผลิต" />
      <div className="space-y-6">
        <ComponentCard title={`ลำดับขั้นตอนผลิต (${pagination?.total ?? products.length})`}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            เลือกสินค้าเพื่อจัดการลำดับขั้นตอนผลิต (ข้อมูลจะถูกบันทึกลง `product_production_steps`)
          </p>
          <PaginationSelector currentLimit={limit} />
          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-max w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      รหัสสินค้า
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      ชื่อสินค้า
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      จำนวน BOM
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      การทำงาน
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {prod.productCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {prod.productName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {prod.boms?.length ?? 0}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Link
                          href={`/master-data/production-steps/${prod.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                        >
                          จัดการขั้นตอนผลิต
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">ไม่พบข้อมูลสินค้า</div>
          )}
          {pagination && (
            <PaginationFooter
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
            />
          )}
        </ComponentCard>
      </div>
    </div>
  );
}

