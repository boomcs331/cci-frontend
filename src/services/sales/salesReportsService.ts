import { apiFetchJson } from "@/utils/api";

export interface SalesByCustomer {
  customerId: number;
  customerName: string;
  customerCode: string;
  totalOrders: number;
  totalSales: number;
}

export interface SalesByProduct {
  productId: number;
  productCode: string;
  productName: string;
  totalQuantity: number;
  totalSales: number;
}

export interface MonthlySales {
  year: number;
  month: number;
  monthName: string;
  totalOrders: number;
  totalSales: number;
}

export interface ReportsSummary {
  salesByCustomer: SalesByCustomer[];
  salesByProduct: SalesByProduct[];
  monthlySales: MonthlySales[];
  year: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function fetchReportsSummary(year?: number): Promise<ReportsSummary> {
  const query = year ? `?year=${year}` : '';
  return apiFetchJson<ApiEnvelope<ReportsSummary>>(
    `/sales/reports/summary${query}`,
  ).then((b) => b.data);
}

export async function fetchSalesByCustomer(year?: number): Promise<SalesByCustomer[]> {
  const query = year ? `?year=${year}` : '';
  return apiFetchJson<ApiEnvelope<SalesByCustomer[]>>(
    `/sales/reports/by-customer${query}`,
  ).then((b) => b.data);
}

export async function fetchSalesByProduct(year?: number): Promise<SalesByProduct[]> {
  const query = year ? `?year=${year}` : '';
  return apiFetchJson<ApiEnvelope<SalesByProduct[]>>(
    `/sales/reports/by-product${query}`,
  ).then((b) => b.data);
}

export async function fetchMonthlySales(year?: number): Promise<MonthlySales[]> {
  const query = year ? `?year=${year}` : '';
  return apiFetchJson<ApiEnvelope<MonthlySales[]>>(
    `/sales/reports/monthly${query}`,
  ).then((b) => b.data);
}
