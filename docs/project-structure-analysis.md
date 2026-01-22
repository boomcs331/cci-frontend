# การวิเคราะห์โครงสร้างโปรเจค และคำแนะนำการปรับปรุง

## 📊 สรุปโครงสร้างปัจจุบัน

### ✅ จุดแข็ง

1. **โครงสร้างชัดเจน**: แยก components, hooks, utils, context ได้ดี
2. **ใช้ Next.js App Router**: โครงสร้างแบบ route groups `(admin)`, `(full-width-pages)`
3. **Component Reusability**: มี UI components ที่นำกลับมาใช้ได้
4. **TypeScript**: ใช้ TypeScript ทั้งโปรเจค
5. **Utility Functions**: มี session.ts และ api.ts สำหรับจัดการ

### ⚠️ จุดที่ควรปรับปรุง

## 🔧 คำแนะนำการปรับปรุง

### 1. **Types & Interfaces** (สำคัญมาก!)

**ปัญหา**: ไม่มีโฟลเดอร์ types/ สำหรับเก็บ TypeScript interfaces

**แนะนำ**: สร้างโฟลเดอร์ `src/types/` และแยก types ออกมา

```
src/types/
├── index.ts              # Export ทั้งหมด
├── material.ts           # Material related types
├── receiving.ts          # Receiving related types
├── user.ts              # User & Auth types
├── api.ts               # API response types
└── common.ts            # Common types
```

**ตัวอย่าง** `src/types/material.ts`:
```typescript
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
  itemsName?: {
    id: number;
    name: string;
  };
  supplier?: Supplier;
}

export interface MaterialType {
  id: number;
  name: string;
  description?: string;
}

export interface Location {
  id: number;
  name: string;
  description?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact?: string;
  address?: string;
}
```

---

### 2. **API Services Layer** (แนะนำสูง)

**ปัญหา**: API calls กระจายอยู่ในหลาย components

**แนะนำ**: สร้าง services layer

```
src/services/
├── index.ts
├── materialService.ts
├── receivingService.ts
├── userService.ts
└── authService.ts
```

**ตัวอย่าง** `src/services/materialService.ts`:
```typescript
import { apiFetchJson } from '@/utils/api';
import type { Material, ApiResponse } from '@/types';

export const materialService = {
  // Get all materials
  getAll: async (): Promise<Material[]> => {
    const response = await apiFetchJson<ApiResponse<Material[]>>('/materials/all');
    return response.data || [];
  },

  // Get materials with pagination
  getPaginated: async (page: number = 1, limit: number = 10, filters?: any) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return apiFetchJson(`/materials?${params}`);
  },

  // Get material by ID
  getById: async (id: number): Promise<Material> => {
    const response = await apiFetchJson<ApiResponse<Material>>(`/materials/${id}`);
    return response.data;
  },

  // Create material
  create: async (data: Partial<Material>): Promise<Material> => {
    const response = await apiFetchJson<ApiResponse<Material>>('/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.data;
  },

  // Update material
  update: async (id: number, data: Partial<Material>): Promise<Material> => {
    const response = await apiFetchJson<ApiResponse<Material>>(`/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.data;
  },

  // Delete material
  delete: async (id: number): Promise<void> => {
    await apiFetchJson(`/materials/${id}`, {
      method: 'DELETE'
    });
  }
};
```

---

### 3. **Custom Hooks สำหรับ Data Fetching**

**ปัญหา**: Logic การ fetch ซ้ำๆ ในหลาย components

**แนะนำ**: สร้าง custom hooks

```
src/hooks/
├── useSessionCheck.ts    # ✅ มีแล้ว
├── useGoBack.ts          # ✅ มีแล้ว
├── useModal.ts           # ✅ มีแล้ว
├── useMaterials.ts       # 🆕 ควรเพิ่ม
├── useReceivings.ts      # 🆕 ควรเพิ่ม
└── useAuth.ts            # 🆕 ควรเพิ่ม
```

**ตัวอย่าง** `src/hooks/useMaterials.ts`:
```typescript
import { useState, useEffect } from 'react';
import { materialService } from '@/services/materialService';
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => fetchMaterials();

  return { materials, loading, error, refresh };
}
```

---

### 4. **Constants & Configuration**

**ปัญหา**: ค่าคงที่กระจายอยู่ในโค้ด

**แนะนำ**: สร้างโฟลเดอร์ constants

```
src/constants/
├── index.ts
├── routes.ts
├── status.ts
└── permissions.ts
```

**ตัวอย่าง** `src/constants/status.ts`:
```typescript
export const MATERIAL_STATUS = {
  ACTIVE: 'ACTIVE',
  USED_UP: 'USED_UP',
  PARTIAL_USED: 'PARTIAL_USED'
} as const;

export const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  USED_UP: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  PARTIAL_USED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
} as const;

export const STATUS_LABELS = {
  ACTIVE: 'ใช้งานได้',
  USED_UP: 'ใช้หมดแล้ว',
  PARTIAL_USED: 'ใช้บางส่วน'
} as const;
```

---

### 5. **Error Handling & Loading States**

**ปัญหา**: ไม่มี error boundary และ loading components กลาง

**แนะนำ**: สร้าง error handling components

```
src/components/common/
├── ErrorBoundary.tsx     # 🆕
├── LoadingSpinner.tsx    # 🆕
├── ErrorMessage.tsx      # 🆕
└── EmptyState.tsx        # 🆕
```

**ตัวอย่าง** `src/components/common/LoadingSpinner.tsx`:
```typescript
export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex justify-center items-center py-8">
      <div className={`${sizes[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`} />
    </div>
  );
}
```

---

### 6. **แยก Components ที่เหลือ**

**ปัญหา**: หน้า `src/app/(admin)/pc/page.tsx` ยังใหญ่มาก

**แนะนำ**: แยก components เหมือนที่ทำกับ income

```
src/components/pc/
├── income/              # ✅ ทำแล้ว
├── outcome/             # 🆕 ควรทำ
├── schedule/            # 🆕 ควรทำ
├── report/              # 🆕 ควรทำ
└── shared/              # 🆕 Components ที่ใช้ร่วมกัน
    ├── MaterialTable.tsx
    ├── MaterialFilters.tsx
    └── MaterialModal.tsx
```

---

### 7. **ปรับปรุง Session Management**

**ปัญหา**: `src/app/(admin)/pc/page.tsx` ยังใช้ `localStorage.getItem('session')` โดยตรง

**แนะนำ**: ใช้ `getSession()` จาก utils

**แก้ไข** `src/app/(admin)/pc/page.tsx`:
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

---

### 8. **Environment Variables**

**ปัญหา**: ไม่มี validation สำหรับ env variables

**แนะนำ**: สร้าง env validation

**สร้างไฟล์** `src/config/env.ts`:
```typescript
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const env = {
  apiBaseUrl: getEnvVar('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3006'),
  authLoginEndpoint: getEnvVar('NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT', '/auth/login'),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;
```

---

### 9. **Testing Setup**

**ปัญหา**: ไม่มี testing setup

**แนะนำ**: เพิ่ม testing libraries

```bash
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

**สร้างโครงสร้าง**:
```
__tests__/
├── components/
├── hooks/
├── utils/
└── services/
```

---

### 10. **Documentation**

**ปัญหา**: ไม่มี README สำหรับแต่ละโมดูล

**แนะนำ**: เพิ่ม README.md ในโฟลเดอร์สำคัญ

```
src/components/pc/income/README.md
src/services/README.md
src/hooks/README.md
```

---

## 📋 สรุปลำดับความสำคัญ

### 🔴 สำคัญมาก (ควรทำก่อน)
1. ✅ สร้าง `src/types/` และแยก interfaces
2. ✅ สร้าง `src/services/` สำหรับ API calls
3. ✅ แก้ไข `pc/page.tsx` ให้ใช้ `getSession()`
4. ✅ สร้าง constants สำหรับค่าคงที่

### 🟡 สำคัญปานกลาง
5. สร้าง custom hooks สำหรับ data fetching
6. เพิ่ม error handling components
7. แยก components ของ outcome, schedule, report

### 🟢 ควรทำ (เมื่อมีเวลา)
8. เพิ่ม testing setup
9. เพิ่ม documentation
10. เพิ่ม env validation

---

## 🎯 โครงสร้างที่แนะนำ (Final)

```
src/
├── app/                    # Next.js App Router
├── components/             # React Components
│   ├── common/            # Shared components
│   ├── ui/                # UI primitives
│   ├── pc/                # PC module components
│   └── ...
├── services/              # 🆕 API service layer
│   ├── materialService.ts
│   ├── receivingService.ts
│   └── authService.ts
├── hooks/                 # Custom React hooks
│   ├── useMaterials.ts   # 🆕
│   ├── useReceivings.ts  # 🆕
│   └── ...
├── utils/                 # Utility functions
│   ├── api.ts            # ✅ มีแล้ว
│   └── session.ts        # ✅ มีแล้ว
├── types/                 # 🆕 TypeScript types
│   ├── material.ts
│   ├── receiving.ts
│   └── index.ts
├── constants/             # 🆕 Constants
│   ├── status.ts
│   ├── routes.ts
│   └── index.ts
├── config/                # 🆕 Configuration
│   └── env.ts
├── context/               # React Context
├── icons/                 # SVG icons
└── layout/                # Layout components
```

---

## 💡 Tips เพิ่มเติม

1. **Code Splitting**: ใช้ dynamic imports สำหรับ components ใหญ่
2. **Memoization**: ใช้ `useMemo` และ `useCallback` ตามความเหมาะสม
3. **Error Logging**: พิจารณาใช้ Sentry หรือ LogRocket
4. **Performance Monitoring**: ใช้ Next.js Analytics
5. **Code Quality**: เพิ่ม Prettier และ Husky pre-commit hooks

---

## 📚 Resources

- [Next.js Best Practices](https://nextjs.org/docs/app/building-your-application)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
