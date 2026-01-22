# API Configuration Guide

## สรุป
โปรเจคได้รับการอัพเดทให้ใช้ environment variables สำหรับ API endpoints แทนการ hardcode URLs

## API Utility Functions

### ไฟล์: `src/utils/api.ts`

```typescript
/**
 * ดึง API Base URL จาก environment variable
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3006';
}

/**
 * สร้าง full API URL จาก endpoint
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

/**
 * Fetch wrapper ที่ใช้ API Base URL อัตโนมัติ
 */
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(endpoint);
  return fetch(url, options);
}

/**
 * Fetch และ parse JSON response
 */
export async function apiFetchJson<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(endpoint, options);
  return response.json();
}
```

## Environment Variables

### Development (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3006
NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT=/auth/login
```

### Production
```env
NEXT_PUBLIC_API_BASE_URL=https://api.production.com
NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT=/auth/login
```

### LAN Network
```env
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.100:3006
NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT=/auth/login
```

## การใช้งาน

### วิธีที่ 1: ใช้ getApiUrl() (แนะนำ)
```typescript
import { getApiUrl } from "@/utils/api";

const response = await fetch(getApiUrl('/materials/all'));
const data = await response.json();
```

### วิธีที่ 2: ใช้ apiFetch()
```typescript
import { apiFetch } from "@/utils/api";

const response = await apiFetch('/materials/all');
const data = await response.json();
```

### วิธีที่ 3: ใช้ apiFetchJson() (สะดวกที่สุด)
```typescript
import { apiFetchJson } from "@/utils/api";

const data = await apiFetchJson('/materials/all');
```

### ตัวอย่างการใช้กับ POST request
```typescript
import { apiFetch } from "@/utils/api";

const response = await apiFetch('/materials/transactions/receive', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const result = await response.json();
```

## ไฟล์ที่ได้รับการอัพเดท

1. `src/utils/api.ts` - สร้างใหม่
2. `src/app/(admin)/pc/income/page.tsx` - อัพเดทให้ใช้ getApiUrl()
3. `src/app/(admin)/pc/page.tsx` - อัพเดทให้ใช้ getApiUrl()

## ข้อดี

1. **เปลี่ยน environment ง่าย**: แค่แก้ไข .env ไม่ต้องแก้โค้ด
2. **ไม่มี hardcoded URLs**: ทุก API call ใช้ environment variable
3. **รองรับหลาย environment**: dev, staging, production, LAN
4. **ลด code duplication**: ใช้ function เดียวกันทั้งโปรเจค
5. **ง่ายต่อการ debug**: เห็น API URL ที่ใช้งานชัดเจน
6. **Type-safe**: มี TypeScript types สำหรับทุก function

## การทดสอบ

### ทดสอบ Local
```bash
# ตั้งค่า .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3006

# รัน dev server
npm run dev
```

### ทดสอบ LAN
```bash
# ตั้งค่า .env.local
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.100:3006

# รัน dev server บน LAN
npm run dev:lan
```

### ทดสอบ Production
```bash
# ตั้งค่า .env.production
NEXT_PUBLIC_API_BASE_URL=https://api.production.com

# Build และ start
npm run build
npm run start
```

## หมายเหตุ

- ตัวแปร environment ที่ขึ้นต้นด้วย `NEXT_PUBLIC_` จะถูก expose ไปยัง client-side
- ต้อง restart dev server ทุกครั้งที่แก้ไข .env files
- ไม่ควร commit .env.local ลง git (ใช้ .env.local.example แทน)
