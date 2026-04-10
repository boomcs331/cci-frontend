import { getApiUrl } from "@/utils/api";
import type { ProductionOrderDetail, ProductionOrdersListResult } from "@/types/production";

export async function fetchProductionOrders(page = 1, limit = 20): Promise<ProductionOrdersListResult> {
  const res = await fetch(getApiUrl(`/production-orders?page=${page}&limit=${limit}`));
  if (!res.ok) {
    throw new Error(`โหลดรายการคำสั่งผลิตไม่สำเร็จ (${res.status})`);
  }
  return res.json();
}

export async function fetchProductionOrder(id: number): Promise<ProductionOrderDetail> {
  const res = await fetch(getApiUrl(`/production-orders/${id}`));
  if (!res.ok) {
    throw new Error(`โหลดคำสั่งผลิตไม่สำเร็จ (${res.status})`);
  }
  return res.json();
}
