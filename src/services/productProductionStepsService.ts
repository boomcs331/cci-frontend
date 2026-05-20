import { apiFetch } from '@/utils/api';
import type {
  CreateProductProductionStepPayload,
  ProductProductionStepListRow,
  ProductProductionStepRow,
  ProductProductionStepsListResult,
  ProductionProcess,
  SetProductionStepsPayload,
  UpdateProductProductionStepPayload,
} from '@/types/production';

interface WrappedResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * ลำดับขั้นตอนผลิตของสินค้า (เรียง stepOrder จาก backend แล้ว)
 */
export async function getProductProductionSteps(productId: number): Promise<ProductProductionStepRow[]> {
  const res = await apiFetch(`/products/${productId}/production-steps`);
  const json = (await res.json()) as WrappedResponse<ProductProductionStepRow[]>;
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `โหลดขั้นตอนผลิตไม่สำเร็จ (${res.status})`);
  }
  return json.data ?? [];
}

/**
 * แทนที่ลำดับทั้งหมด (ต้องมี BOM อย่างน้อย 1 รายการเมื่อ steps ไม่ว่าง)
 */
export async function setProductProductionSteps(
  productId: number,
  payload: SetProductionStepsPayload
): Promise<ProductProductionStepRow[]> {
  const res = await apiFetch(`/products/${productId}/production-steps`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as WrappedResponse<ProductProductionStepRow[]>;
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `บันทึกขั้นตอนผลิตไม่สำเร็จ (${res.status})`);
  }
  return json.data ?? [];
}

/** Master process — backend คืนเป็น array ไม่หุ้ม { data } */
export async function getMasterProductionProcesses(): Promise<ProductionProcess[]> {
  const res = await apiFetch('/production-orders/processes/all');
  if (!res.ok) {
    throw new Error(`โหลด master process ไม่สำเร็จ (${res.status})`);
  }
  return res.json() as Promise<ProductionProcess[]>;
}

interface WrappedList<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function listProductProductionSteps(params: {
  page?: number;
  limit?: number;
  productId?: number;
  search?: string;
}): Promise<ProductProductionStepsListResult> {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.productId) sp.set('productId', String(params.productId));
  if (params.search?.trim()) sp.set('search', params.search.trim());
  const qs = sp.toString();
  const res = await apiFetch(
    `/masters/product-production-steps${qs ? `?${qs}` : ''}`
  );
  const json = (await res.json()) as WrappedList<ProductProductionStepsListResult>;
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `โหลดรายการขั้นตอนผลิตไม่สำเร็จ (${res.status})`);
  }
  return json.data;
}

export async function createProductProductionStep(
  payload: CreateProductProductionStepPayload
): Promise<ProductProductionStepListRow> {
  const res = await apiFetch('/masters/product-production-steps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as WrappedList<ProductProductionStepListRow>;
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `เพิ่มขั้นตอนผลิตไม่สำเร็จ (${res.status})`);
  }
  return json.data;
}

export async function updateProductProductionStep(
  id: number,
  payload: UpdateProductProductionStepPayload
): Promise<ProductProductionStepListRow> {
  const res = await apiFetch(`/masters/product-production-steps/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as WrappedList<ProductProductionStepListRow>;
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `แก้ไขขั้นตอนผลิตไม่สำเร็จ (${res.status})`);
  }
  return json.data;
}

export async function deleteProductProductionStep(id: number): Promise<void> {
  const res = await apiFetch(`/masters/product-production-steps/${id}`, {
    method: 'DELETE',
  });
  const json = (await res.json()) as { success?: boolean; message?: string };
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `ลบขั้นตอนผลิตไม่สำเร็จ (${res.status})`);
  }
}
