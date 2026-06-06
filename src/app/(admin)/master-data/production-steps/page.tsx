"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PageContainer,
  PageHeader,
  ContentCard,
  DataTable,
  LoadingState,
  type Column,
} from "@/components/shared";
import PaginationSelector from "@/components/pagination/PaginationSelector";
import PaginationFooter from "@/components/pagination/PaginationFooter";
import { apiFetch } from "@/utils/api";

export default function MasterDataProductionStepsPage() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const columns: Column<any>[] = [
    { key: 'productCode', title: 'รหัสสินค้า' },
    { key: 'productName', title: 'ชื่อสินค้า' },
    { key: 'boms', title: 'จำนวน BOM', render: (value) => value?.length ?? 0 },
    {
      key: 'actions',
      title: 'การทำงาน',
      render: (_, row) => (
        <Link
          href={`/master-data/production-steps/${row.id}`}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
        >
          จัดการขั้นตอนผลิต
        </Link>
      ),
    },
  ];

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/products?page=${page}&limit=${limit}`);
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
    return <LoadingState message="กำลังโหลด..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="ลำดับขั้นตอนผลิต"
        description={`ทั้งหมด ${pagination?.total ?? products.length} รายการ`}
      />

      <ContentCard>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          เลือกสินค้าเพื่อจัดการลำดับขั้นตอนผลิต (ข้อมูลจะถูกบันทึกลง `product_production_steps`)
        </p>
        <PaginationSelector currentLimit={limit} />
        <DataTable
          columns={columns}
          data={products}
          emptyMessage="ไม่พบข้อมูลสินค้า"
          rowKey="id"
        />
        {pagination && (
          <PaginationFooter
            size="sm"
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
          />
        )}
      </ContentCard>
    </PageContainer>
  );
}

