# Quick Start - การปรับปรุงโปรเจค

## ✅ สิ่งที่สร้างให้แล้ว

### 1. Types (TypeScript Interfaces)
```
src/types/
├── index.ts              ✅ Export ทั้งหมด
├── material.ts           ✅ Material, Location, Supplier types
├── receiving.ts          ✅ Receiving, Lot types
├── user.ts              ✅ User, Role, Permission types
├── api.ts               ✅ API response types
└── common.ts            ✅ Common UI types
```

### 2. Constants
```
src/constants/
├── index.ts             ✅ Export ทั้งหมด
├── status.ts            ✅ Status constants & helpers
├── routes.ts            ✅ Application routes
└── permissions.ts       ✅ Permission constants & helpers
```

### 3. Services (API Layer)
```
src/services/
├── index.ts             ✅ Export ทั้งหมด
├── materialService.ts   ✅ Material CRUD operations
├── receivingService.ts  ✅ Receiving operations
└── authService.ts       ✅ Authentication operations
```

---

## 🚀 วิธีใช้งาน

### ใช้ Types
```typescript
// ❌ ไม่แนะนำ - อาจมีปัญหากับ TypeScript
import type { Material, Receiving, User } from '@/types';

// ✅ แนะนำ - Import โดยตรงจากไฟล์
import type { Material } from '@/types/material';
import type { Receiving } from '@/types/receiving';
import type { User } from '@/types/user';

const material: Material = {
  id: 1,
  matCode: 'MAT001',
  // ...
};
```

### ใช้ Constants
```typescript
import { STATUS_COLORS, getStatusBadgeClass, ROUTES } from '@/constants';

// Get status color
const colorClass = getStatusBadgeClass('ACTIVE');

// Navigate
router.push(ROUTES.PC_INCOME);
```

### ใช้ Services
```typescript
import { materialService, receivingService, authService } from '@/services';

// Get materials
const materials = await materialService.getAll();

// Create receiving
const receiving = await receivingService.create({
  materialId: 1,
  totalQuantity: 100,
  locationId: 1,
  createBy: 'admin'
});

// Login
const response = await authService.login({
  username: 'admin',
  password: 'password'
});
```

---

## 📝 ตัวอย่างการแก้ไขโค้ดเดิม

### ก่อน (เดิม)
```typescript
// ❌ Hardcoded types
const [materials, setMaterials] = useState<any[]>([]);

// ❌ Inline API call
const response = await fetch('http://localhost:3006/materials/all');
const data = await response.json();
setMaterials(data.data || []);

// ❌ Hardcoded status colors
const getStatusBadge = (status: string) => {
  const colors: any = {
    ACTIVE: 'bg-green-100 text-green-800',
    USED_UP: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100';
};
```

### หลัง (ใหม่)
```typescript
// ✅ Typed
import type { Material } from '@/types';
import { materialService } from '@/services';
import { getStatusBadgeClass } from '@/constants';

const [materials, setMaterials] = useState<Material[]>([]);

// ✅ Use service
const materials = await materialService.getAll();
setMaterials(materials);

// ✅ Use constant helper
const colorClass = getStatusBadgeClass(status);
```

---

## 🔄 ขั้นตอนต่อไป (แนะนำ)

### 1. แก้ไข pc/page.tsx ให้ใช้ getSession()
```typescript
// ❌ เดิม
const session = localStorage.getItem('session');
if (session) {
  const parsedSession = JSON.parse(session);
  setCurrentUser(parsedSession.user?.username || 'admin');
}

// ✅ ใหม่
import { getSession } from '@/utils/session';

const session = getSession();
if (session) {
  setCurrentUser(session.user?.username || 'admin');
}
```

### 2. แก้ไข pc/income/page.tsx ให้ใช้ services
```typescript
// ❌ เดิม
const [rcvRes, matsRes, locsRes, suppsRes] = await Promise.all([
  fetch(getApiUrl(`/materials/transactions/receivings?page=${page}&limit=${limit}`)),
  fetch(getApiUrl('/materials/all')),
  fetch(getApiUrl('/materials/locations/all')),
  fetch(getApiUrl('/materials/suppliers/all'))
]);

// ✅ ใหม่
import { materialService, receivingService } from '@/services';

const [receivingsData, materials, locations, suppliers] = await Promise.all([
  receivingService.getPaginated(page, limit),
  materialService.getAll(),
  materialService.getLocations(),
  materialService.getSuppliers()
]);
```

### 3. สร้าง Custom Hooks (ถ้ามีเวลา)
```typescript
// src/hooks/useMaterials.ts
import { useState, useEffect } from 'react';
import { materialService } from '@/services';
import type { Material } from '@/types';

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await materialService.getAll();
      setMaterials(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  return { materials, loading, error, refresh: fetchMaterials };
}

// ใช้งาน
const { materials, loading, error, refresh } = useMaterials();
```

---

## 📚 เอกสารเพิ่มเติม

- `docs/project-structure-analysis.md` - วิเคราะห์โครงสร้างแบบละเอียด
- `docs/api-configuration.md` - คู่มือการตั้งค่า API
- `docs/session-timeout-guide.md` - คู่มือ Session Management
- `docs/pc-income-refactoring.md` - ตัวอย่างการแยก Components

---

## 💡 Tips

1. **Import แบบ Type-only**: ใช้ `import type` สำหรับ types เพื่อลดขนาด bundle
2. **Tree Shaking**: Export แบบ named exports เพื่อให้ tree shaking ทำงานได้ดี
3. **Consistent Naming**: ใช้ชื่อที่สอดคล้องกันทั้งโปรเจค
4. **Error Handling**: เพิ่ม try-catch ในทุก service call
5. **Loading States**: แสดง loading state ขณะ fetch data

---

## ✨ ประโยชน์ที่ได้รับ

- ✅ **Type Safety**: ลด runtime errors ด้วย TypeScript
- ✅ **Code Reusability**: ใช้ services และ constants ซ้ำได้
- ✅ **Maintainability**: แก้ไขง่าย เพราะแยกส่วนชัดเจน
- ✅ **Testability**: ทดสอบ services แยกจาก components ได้
- ✅ **Consistency**: ใช้ constants ทำให้โค้ดสอดคล้องกัน
- ✅ **Developer Experience**: Autocomplete และ IntelliSense ทำงานได้ดี
