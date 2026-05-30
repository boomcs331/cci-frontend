"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import { baht } from "@/app/(admin)/sales/_components/salesOrderUi";

interface SalesProduct {
  id: number;
  productCode: string;
  productName: string;
  barcode: string | null;
  salePrice: number | null;
  categoryId: number | null;
  isActive: boolean;
  stockQuantity: string | null;
}

export default function SalesProductsPage() {
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sales/products?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data.data || []);
    } catch {
      setError("โหลดข้อมูลสินค้าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const inputClass =
    "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <div>
      <PageBreadcrumb pageTitle="สินค้า (ฝั่งขาย)" />

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <ComponentCard title="รายการสินค้า" desc="จัดการสินค้าสำหรับการขาย">
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            ค้นหา:
          </label>
          <input
            className={inputClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="รหัสสินค้า / ชื่อสินค้า / Barcode"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">รหัสสินค้า</th>
                <th className="px-4 py-3 font-medium">ชื่อสินค้า</th>
                <th className="px-4 py-3 font-medium">Barcode</th>
                <th className="px-4 py-3 text-right font-medium">ราคาขาย</th>
                <th className="px-4 py-3 text-right font-medium">สต็อก</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableEmptyRow colSpan={6} message="กำลังโหลด..." />
              ) : products.length === 0 ? (
                <TableEmptyRow colSpan={6} message="ไม่มีข้อมูลสินค้า" />
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-medium">{product.productCode}</td>
                    <td className="px-4 py-3">{product.productName}</td>
                    <td className="px-4 py-3">{product.barcode || "-"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {product.salePrice ? baht.format(product.salePrice) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {product.stockQuantity || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          product.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ComponentCard>
    </div>
  );
}
