import { apiFetchJson } from "@/utils/api";

export interface DashboardKPI {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSales: number;
  thisMonthSales: number;
  thisMonthOrders: number;
}

export interface SalesChartPoint {
  date: string;
  sales: number;
  orders: number;
}

export interface TopProduct {
  productId: number;
  productCode: string;
  productName: string;
  totalQuantity: number;
  totalSales: number;
}

export interface UpcomingDelivery {
  orderId: string;
  orderNo: string;
  customerName: string;
  deliveryDate: string;
  grandTotal: number;
  status: string;
}

export interface DashboardSummary {
  kpi: DashboardKPI;
  salesChart: SalesChartPoint[];
  topProducts: TopProduct[];
  upcomingDeliveries: UpcomingDelivery[];
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetchJson<ApiEnvelope<DashboardSummary>>(
    "/sales/dashboard/summary",
  ).then((b) => b.data);
}

export async function fetchDashboardKPI(): Promise<DashboardKPI> {
  return apiFetchJson<ApiEnvelope<DashboardKPI>>(
    "/sales/dashboard/kpi",
  ).then((b) => b.data);
}

export async function fetchSalesChart(days: number = 30): Promise<SalesChartPoint[]> {
  return apiFetchJson<ApiEnvelope<SalesChartPoint[]>>(
    `/sales/dashboard/sales-chart?days=${days}`,
  ).then((b) => b.data);
}

export async function fetchTopProducts(limit: number = 5): Promise<TopProduct[]> {
  return apiFetchJson<ApiEnvelope<TopProduct[]>>(
    `/sales/dashboard/top-products?limit=${limit}`,
  ).then((b) => b.data);
}

export async function fetchUpcomingDeliveries(days: number = 7): Promise<UpcomingDelivery[]> {
  return apiFetchJson<ApiEnvelope<UpcomingDelivery[]>>(
    `/sales/dashboard/upcoming-deliveries?days=${days}`,
  ).then((b) => b.data);
}
