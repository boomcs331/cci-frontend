"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PageContainer, PageHeader, ContentCard, LoadingState } from "@/components/shared";
import { baht } from "@/app/(admin)/sales/_components/salesOrderUi";

interface SalesCustomer {
  id: number;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  creditLimit: number | null;
  creditBalance: number | null;
  paymentTerms: string | null;
  taxId: string | null;
  isActive: boolean;
}

export default function SalesCustomersPage() {
  const [customers, setCustomers] = useState<SalesCustomer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sales/customers?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(data.data || []);
    } catch {
      setError("โหลดข้อมูลลูกค้าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const inputClass =
    "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  if (loading) return <LoadingState message="กำลังโหลด..." />;

  return (
    <PageContainer>
      <PageHeader
        title="ลูกค้า (ฝั่งขาย)"
        description={`ทั้งหมด ${customers.length} รายการ`}
      />

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <ContentCard title="รายการลูกค้า">
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            ค้นหา:
          </label>
          <input
            className={inputClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="รหัสลูกค้า / ชื่อลูกค้า"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">รหัสลูกค้า</th>
                <th className="px-4 py-3 font-medium">ชื่อลูกค้า</th>
                <th className="px-4 py-3 font-medium">เบอร์โทร</th>
                <th className="px-4 py-3 font-medium">อีเมล</th>
                <th className="px-4 py-3 text-right font-medium">วงเงินเครดิต</th>
                <th className="px-4 py-3 text-right font-medium">ยอดคงเหลือ</th>
                <th className="px-4 py-3 font-medium">เงื่อนไขชำระ</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    ไม่มีข้อมูลลูกค้า
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-medium">{customer.code}</td>
                    <td className="px-4 py-3">{customer.name}</td>
                    <td className="px-4 py-3">{customer.phone || "-"}</td>
                    <td className="px-4 py-3">{customer.email || "-"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {customer.creditLimit ? baht.format(customer.creditLimit) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {customer.creditBalance ? baht.format(customer.creditBalance) : "-"}
                    </td>
                    <td className="px-4 py-3">{customer.paymentTerms || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          customer.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                        }`}
                      >
                        {customer.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </PageContainer>
  );
}
