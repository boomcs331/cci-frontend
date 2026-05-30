"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import {
  fetchReportsSummary,
  type SalesByCustomer,
  type SalesByProduct,
  type MonthlySales,
} from "@/services/sales/salesReportsService";
import { baht } from "@/app/(admin)/sales/_components/salesOrderUi";

export default function SalesReportsPage() {
  const [salesByCustomer, setSalesByCustomer] = useState<SalesByCustomer[]>([]);
  const [salesByProduct, setSalesByProduct] = useState<SalesByProduct[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReportsSummary(year);
      setSalesByCustomer(data.salesByCustomer);
      setSalesByProduct(data.salesByProduct);
      setMonthlySales(data.monthlySales);
    } catch {
      setError("โหลดรายงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const inputClass =
    "h-10 w-32 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <div>
      <PageBreadcrumb pageTitle="รายงานขาย" />

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <ComponentCard title="รายงานขาย" desc="สรุปยอดขายแยกตามลูกค้า สินค้า และเดือน">
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            ปี:
          </label>
          <input
            type="number"
            className={inputClass}
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
            min={2020}
            max={2030}
          />
        </div>

        {loading ? (
          <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400">
            กำลังโหลด...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Sales by Customer */}
            <ComponentCard title="ยอดขายตามลูกค้า" desc="10 ลูกค้าที่มียอดขายสูงสุด">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">ลูกค้า</th>
                      <th className="px-4 py-3 text-right font-medium">ออเดอร์</th>
                      <th className="px-4 py-3 text-right font-medium">ยอดขาย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {salesByCustomer.length === 0 ? (
                      <TableEmptyRow colSpan={3} message="ไม่มีข้อมูล" />
                    ) : (
                      salesByCustomer.slice(0, 10).map((customer) => (
                        <tr
                          key={customer.customerId}
                          className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">{customer.customerName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {customer.customerCode}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {customer.totalOrders.toLocaleString("th-TH")}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {baht.format(customer.totalSales)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </ComponentCard>

            {/* Sales by Product */}
            <ComponentCard title="ยอดขายตามสินค้า" desc="10 สินค้าที่มียอดขายสูงสุด">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">สินค้า</th>
                      <th className="px-4 py-3 text-right font-medium">จำนวน</th>
                      <th className="px-4 py-3 text-right font-medium">ยอดขาย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {salesByProduct.length === 0 ? (
                      <TableEmptyRow colSpan={3} message="ไม่มีข้อมูล" />
                    ) : (
                      salesByProduct.slice(0, 10).map((product) => (
                        <tr
                          key={product.productId}
                          className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">{product.productName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {product.productCode}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {product.totalQuantity.toLocaleString("th-TH")}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {baht.format(product.totalSales)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </ComponentCard>
          </div>
        )}

        {/* Monthly Sales */}
        <div className="mt-6">
          <ComponentCard title="ยอดขายรายเดือน" desc={`ยอดขายแยกตามเดือนปี ${year}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">เดือน</th>
                    <th className="px-4 py-3 text-right font-medium">ออเดอร์</th>
                    <th className="px-4 py-3 text-right font-medium">ยอดขาย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {monthlySales.length === 0 ? (
                    <TableEmptyRow colSpan={3} message="ไม่มีข้อมูล" />
                  ) : (
                    monthlySales.map((month) => (
                      <tr
                        key={`${month.year}-${month.month}`}
                        className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-medium">{month.monthName}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {month.totalOrders.toLocaleString("th-TH")}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {baht.format(month.totalSales)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ComponentCard>
        </div>
      </ComponentCard>
    </div>
  );
}
