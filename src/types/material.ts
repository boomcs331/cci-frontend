// Material related types

export interface Material {
  id: number;
  matCode: string;
  matTypeId: number;
  defaultLocationId: number;
  lr: string;
  lotSize: number;
  unit: string;
  isActive: boolean;
  createDate: string;
  createBy: string;
  updateDate: string | null;
  updateBy: string | null;
  supplierId?: number;
  /** Path รูปชิ้นงานจาก API อัปโหลด */
  workpieceImagePath?: string | null;
  itemsName?: ItemsName;
  supplier?: Supplier;
  materialType?: MaterialType;
  location?: Location;
}

export interface ItemsName {
  id: number;
  name: string;
  description?: string;
}

export interface MaterialType {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Location {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  contact?: string;
  address?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
}

export interface MaterialFilters {
  matCode?: string;
  matTypeId?: number;
  supplierId?: number;
  locationId?: number;
  isActive?: boolean;
}
