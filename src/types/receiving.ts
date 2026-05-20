// Receiving related types
import type { Material, Supplier, Location } from './material';

export interface Receiving {
  id: number;
  receivingNo: string;
  receivingDate: string;
  materialId: number;
  supplierId?: number;
  totalQuantity: number;
  unit: string;
  poNo?: string;
  remark?: string;
  status: ReceivingStatus;
  createBy: string;
  createDate: string;
  updateBy?: string;
  updateDate?: string;
  material?: Material;
  supplier?: Supplier;
  lots?: Lot[];
}

export interface Lot {
  id: number;
  lotNo: string;
  receivingId: number;
  qrCode: string;
  quantity: number;
  remainingQuantity: number;
  unit: string;
  locationId: number;
  expiryDate?: string;
  status: LotStatus;
  createDate: string;
  location?: Location;
}

export type ReceivingStatus = 'ACTIVE' | 'USED_UP' | 'PARTIAL_USED';
export type LotStatus = 'ACTIVE' | 'USED_UP' | 'PARTIAL_USED';

export interface CreateReceivingPayload {
  materialId: number;
  totalQuantity: number;
  locationId: number;
  createBy: string;
  supplierId?: number;
  poNo: string;
  remark?: string;
  expiryDate?: string;
}

export interface ReceivingFilters {
  receivingNo?: string;
  materialId?: number;
  supplierId?: number;
  status?: ReceivingStatus;
  startDate?: string;
  endDate?: string;
}
