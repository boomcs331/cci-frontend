import { apiFetch } from '@/utils/api';
import type { ProductProductionStepRow, ProductionProcess, SetProductionStepsPayload } from '@/types/production';

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
