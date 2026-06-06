"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PageContainer, PageHeader, ContentCard, LoadingState } from "@/components/shared";
import {
  fetchDashboardSummary,
  type DashboardKPI,
  type SalesChartPoint,
  type TopProduct,
  type UpcomingDelivery,
} from "@/services/sales/salesDashboardService";
import { baht, formatDate } from "@/app/(admin)/sales/_components/salesOrderUi";

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; className: string }> = {
    APPROVED: { label: "อนุมัติแล้ว", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    PROCESSING: { label: "กำลังดำเนินการ", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
    SHIPPING: { label: "กำลังจัดส่ง", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  };
  return map[status] || { label: status, className: "bg-gray-100 text-gray-700" };
};

export default function SalesDashboardPage() {
  const [kpi, setKpi] = useState<DashboardKPI | null>(null);
  const [salesChart, setSalesChart] = useState<SalesChartPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<UpcomingDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardSummary();
      setKpi(data.kpi);
      setSalesChart(data.salesChart);
      setTopProducts(data.topProducts);
      setUpcomingDeliveries(data.upcomingDeliveries);
    } catch {
      setError("โหลดข้อมูล Dashboard ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const KPICard = ({
    title,
    value,
    subtitle,
    color = "blue",
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: "blue" | "green" | "yellow" | "rose";
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
      green: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
      yellow: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
      rose: "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800",
    };
    const textClasses = {
      blue: "text-blue-700 dark:text-blue-300",
      green: "text-green-700 dark:text-green-300",
      yellow: "text-yellow-700 dark:text-yellow-300",
      rose: "text-rose-700 dark:text-rose-300",
    };

    return (
      <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className={`mt-2 text-2xl font-bold ${textClasses[color]}`}>
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    );
  };

  if (loading) return <LoadingState message="กำลังโหลด..." />;

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard ขาย"
        description="ภาพรวมยอดขายและสถานะออเดอร์"
      />

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <>
          {/* KPI Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="ออเดอร์ทั้งหมด"
              value={kpi?.totalOrders || 0}
              subtitle={`รอดำเนินการ: ${kpi?.pendingOrders || 0}`}
              color="blue"
            />
            <KPICard
              title="ยอดขายรวม"
              value={baht.format(kpi?.totalSales || 0)}
              subtitle={`เดือนนี้: ${baht.format(kpi?.thisMonthSales || 0)}`}
              color="green"
            />
            <KPICard
              title="ออเดอร์สำเร็จ"
              value={kpi?.completedOrders || 0}
              subtitle={`อนุมัติแล้ว: ${kpi?.approvedOrders || 0}`}
              color="green"
            />
            <KPICard
              title="ออเดอร์ยกเลิก"
              value={kpi?.cancelledOrders || 0}
              subtitle="ออเดอร์ที่ถูกยกเลิก"
              color="rose"
            />
          </div>

          {/* Sales Chart */}
          <ContentCard title="กราฟยอดขาย 30 วันล่าสุด">
            <div className="h-64">
              {salesChart.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  ไม่มีข้อมูล
                </div>
              ) : (
                <div className="flex h-full items-end gap-1">
                  {salesChart.map((point) => {
                    const maxSales = Math.max(...salesChart.map((p) => p.sales));
                    const height = maxSales > 0 ? (point.sales / maxSales) * 100 : 0;
                    return (
                      <div
                        key={point.date}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <div className="w-full bg-brand-500/20 dark:bg-brand-500/30">
                          <div
                            className="bg-brand-500 dark:bg-brand-400"
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {new Date(point.date).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ContentCard>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top Products */}
            <ContentCard title="Top 5 สินค้าขายดี">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">รหัสสินค้า</th>
                      <th className="px-4 py-3 font-medium">ชื่อสินค้า</th>
                      <th className="px-4 py-3 text-right font-medium">จำนวน</th>
                      <th className="px-4 py-3 text-right font-medium">ยอดขาย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          ไม่มีข้อมูล
                        </td>
                      </tr>
                    ) : (
                      topProducts.map((product) => (
                        <tr
                          key={product.productId}
                          className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                        >
                          <td className="px-4 py-3 font-medium">
                            {product.productCode}
                          </td>
                          <td className="px-4 py-3">{product.productName}</td>
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
            </ContentCard>

            {/* Upcoming Deliveries */}
            <ContentCard title="ออเดอร์ใกล้จัดส่ง">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">เลขออเดอร์</th>
                      <th className="px-4 py-3 font-medium">ลูกค้า</th>
                      <th className="px-4 py-3 font-medium">วันจัดส่ง</th>
                      <th className="px-4 py-3 text-right font-medium">ยอดรวม</th>
                      <th className="px-4 py-3 font-medium">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {upcomingDeliveries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          ไม่มีออเดอร์ที่ต้องจัดส่งเร็วๆ นี้
                        </td>
                      </tr>
                    ) : (
                      upcomingDeliveries.map((delivery) => {
                        const badge = statusBadge(delivery.status);
                        return (
                          <tr
                            key={delivery.orderId}
                            className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                          >
                            <td className="px-4 py-3 font-medium">
                              {delivery.orderNo}
                            </td>
                            <td className="px-4 py-3">{delivery.customerName}</td>
                            <td className="px-4 py-3">
                              {formatDate(delivery.deliveryDate)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {baht.format(delivery.grandTotal)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </ContentCard>
          </div>
        </>
      </PageContainer>
  );
}
