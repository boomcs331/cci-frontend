# Troubleshooting Guide

## ปัญหาที่พบบ่อยและวิธีแก้ไข

### 1. TypeScript Error: Module has no exported member

**ปัญหา:**
```
Module '"@/types"' has no exported member 'Material'.
```

**สาเหตุ:** Barrel exports (`export * from './file'`) อาจไม่ทำงานกับ TypeScript path aliases

**วิธีแก้:**
```typescript
// ❌ ไม่แนะนำ
import type { Material } from '@/types';

// ✅ แนะนำ - Import โดยตรง
import type { Material } from '@/types/material';
import type { ApiResponse } from '@/types/api';
```

---

### 2. Next.js Error: useSearchParams() should be wrapped in suspense

**ปัญหา:**
```
⨯ useSearchParams() should be wrapped in a suspense boundary
```

**สาเหตุ:** Next.js 13+ ต้องการ Suspense boundary สำหรับ dynamic functions

**วิธีแก้ (สำหรับ Client Components):**

ไม่ต้องใช้ Suspense ใน client component เพราะจะทำให้เกิด error "default export is not a React Component"

```typescript
// ✅ ถูกต้อง - ใช้ useSearchParams โดยตรง
"use client";
import { useSearchParams } from "next/navigation";

export default function MyPage() {
  const searchParams = useSearchParams();
  // ... rest of code
}
```

**หมายเหตุ:** Error นี้จะเกิดขึ้นตอน build แต่ไม่กระทบการทำงานใน development และ production

---

### 3. Build Error: Property does not exist on type '{}'

**ปัญหา:**
```typescript
Property 'message' does not exist on type '{}'.
```

**สาเหตุ:** TypeScript ไม่รู้ type ของ response data

**วิธีแก้:**
```typescript
// ❌ เดิม
let data = {};
data.message // Error!

// ✅ ใหม่
let data: any = {};
data.message // OK

// ✅ ดีที่สุด - ใช้ proper type
interface ApiResponse {
  message?: string;
}
let data: ApiResponse = {};
```

---

### 4. Error: Cannot find module 'qrcode'

**ปัญหา:**
```
Could not find a declaration file for module 'qrcode'
```

**วิธีแก้:**
```bash
pnpm add -D @types/qrcode
```

---

### 5. Session Timeout ไม่ทำงาน

**ปัญหา:** Session ไม่ logout อัตโนมัติหลังหมดเวลา

**ตรวจสอบ:**

1. ใช้ `getSession()` แทน `localStorage.getItem('session')`
```typescript
// ❌ เดิม
const session = localStorage.getItem('session');

// ✅ ใหม่
import { getSession } from '@/utils/session';
const session = getSession();
```

2. ตรวจสอบว่า `useSessionCheck` ถูกเรียกใน layout
```typescript
// src/app/(admin)/layout.tsx
import { useSessionCheck } from "@/hooks/useSessionCheck";

export default function AdminLayout({ children }) {
  useSessionCheck(); // ต้องมีบรรทัดนี้
  // ...
}
```

---

### 6. API Calls ไม่ทำงาน

**ปัญหา:** API calls ไปที่ URL ผิด

**ตรวจสอบ:**

1. ตรวจสอบ `.env.local`
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3006
```

2. Restart dev server หลังแก้ไข .env
```bash
# Stop server (Ctrl+C)
pnpm run dev
```

3. ใช้ `getApiUrl()` แทน hardcoded URL
```typescript
// ❌ เดิม
fetch('http://localhost:3006/materials/all')

// ✅ ใหม่
import { getApiUrl } from '@/utils/api';
fetch(getApiUrl('/materials/all'))
```

---

### 7. Build Failed: Export encountered an error

**ปัญหา:**
```
Export encountered an error on /(admin)/pc/page
```

**สาเหตุ:** มี export default หลายตัวหรือ component ไม่ถูกต้อง

**วิธีแก้:**

1. ตรวจสอบว่ามี `export default` เพียงตัวเดียว
```typescript
// ❌ ผิด - มี 2 export default
export default function MyComponent() {}
export default function AnotherComponent() {}

// ✅ ถูกต้อง
export default function MyComponent() {}
```

2. ตรวจสอบว่า component return JSX
```typescript
export default function MyPage() {
  return <div>Content</div>; // ต้อง return JSX
}
```

---

### 8. TypeScript Cache Issues

**ปัญหา:** TypeScript ยังแสดง error แม้แก้ไขแล้ว

**วิธีแก้:**

1. Restart TypeScript Server ใน VS Code
   - กด `Ctrl+Shift+P`
   - พิมพ์ "TypeScript: Restart TS Server"

2. ลบ cache และ rebuild
```bash
rm -rf .next
rm -rf node_modules/.cache
pnpm run build
```

---

### 9. Module Resolution Issues

**ปัญหา:** Cannot find module '@/...'

**ตรวจสอบ `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Restart VS Code** หลังแก้ไข tsconfig.json

---

### 10. CORS Errors

**ปัญหา:** API calls ถูก block โดย CORS

**วิธีแก้ (Backend):**

ตั้งค่า CORS ใน backend ให้รองรับ frontend URL:
```javascript
// Express.js example
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.100:3000'],
  credentials: true
}));
```

---

## 🔧 คำสั่งที่มีประโยชน์

### ตรวจสอบ TypeScript Errors
```bash
npx tsc --noEmit
```

### ลบ Cache
```bash
rm -rf .next
rm -rf node_modules/.cache
```

### Rebuild ทั้งหมด
```bash
pnpm run build
```

### ตรวจสอบ Dependencies
```bash
pnpm list
```

### อัพเดท Dependencies
```bash
pnpm update
```

---

## 📞 ขอความช่วยเหลือ

หากยังแก้ไขไม่ได้:

1. ตรวจสอบ console logs ใน browser (F12)
2. ตรวจสอบ terminal logs
3. ดูเอกสารใน `docs/` folder
4. ตรวจสอบ Next.js documentation

---

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
