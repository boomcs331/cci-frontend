import { apiFetch } from '@/utils/api';
import type {
  CreateProductionProcessPayload,
  ProductionProcess,
  ProductionProcessesListResult,
  UpdateProductionProcessPayload,
} from '@/types/production';

interface Wrapped<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function listProductionProcesses(params: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}): Promise<ProductionProcessesListResult> {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.search?.trim()) sp.set('search', params.search.trim());
  if (params.isActive !== undefined) sp.set('isActive', String(params.isActive));
  const qs = sp.toString();
  const res = await apiFetch(
    `/masters/production-processes${qs ? `?${qs}` : ''}`
  );
  const json = (await res.json()) as Wrapped<ProductionProcessesListResult>;
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `โหลดกระบวนการผลิตไม่สำเร็จ (${res.status})`);
  }
  return json.data;
}

export async function createProductionProcess(
  payload: CreateProductionProcessPayload
): Promise<ProductionProcess> {
  const res = await apiFetch('/masters/production-processes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as Wrapped<ProductionProcess>;
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `เพิ่มกระบวนการไม่สำเร็จ (${res.status})`);
  }
  return json.data;
}

export async function updateProductionProcess(
  id: number,
  payload: UpdateProductionProcessPayload
): Promise<ProductionProcess> {
  const res = await apiFetch(`/masters/production-processes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as Wrapped<ProductionProcess>;
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `แก้ไขกระบวนการไม่สำเร็จ (${res.status})`);
  }
  return json.data;
}

export async function deleteProductionProcess(
  id: number
): Promise<{ message: string; deactivated?: boolean }> {
  const res = await apiFetch(`/masters/production-processes/${id}`, {
    method: 'DELETE',
  });
  const json = (await res.json()) as Wrapped<{
    message: string;
    deactivated?: boolean;
  }>;
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `ลบกระบวนการไม่สำเร็จ (${res.status})`);
  }
  return json.data;
}
