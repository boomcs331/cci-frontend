# PC Income Page - Component Refactoring

## สรุป
ได้แยก page.tsx ออกเป็น components ย่อยๆ เพื่อให้โค้ดอ่านง่าย บำรุงรักษาง่าย และนำกลับมาใช้ใหม่ได้
และเปลี่ยนการเรียก API endpoints ให้ใช้ค่าจาก environment variables

## Components ที่สร้างขึ้น

### 1. `ReceivingTable.tsx`
ตารางแสดงรายการรับเข้าวัตถุดิบ
- แสดงข้อมูลการรับเข้าทั้งหมด
- มีปุ่มดูรายละเอียดและพิมพ์ QR Code

### 2. `AddReceivingModal.tsx`
Modal สำหรับเพิ่มรายการรับเข้าใหม่
- ฟอร์มกรอกข้อมูลวัตถุดิบ
- Auto-fill ซัพพลายเออร์และที่เก็บตามวัตถุดิบที่เลือก

### 3. `ReceivingDetailModal.tsx`
Modal แสดงรายละเอียดการรับเข้า
- แสดงข้อมูลการรับเข้าแบบละเอียด
- แสดงรายการ Lot พร้อม QR Code

### 4. `QRCodeModal.tsx`
Modal แสดง QR Code แบบเดี่ยว
- แสดง QR Code ขนาดใหญ่
- มีปุ่มพิมพ์

### 5. `PrintAllQRModal.tsx`
Modal สำหรับพิมพ์ QR Code ทั้งหมด
- แสดง QR Code ทั้งหมดในรูปแบบสติ๊กเกอร์
- รองรับการพิมพ์ A4 (4 คอลัมน์ x 5 แถว)
- มี print styles ในตัว

### 6. `Pagination.tsx`
Component สำหรับแสดง pagination
- แสดงจำนวนรายการ
- ปุ่ม Previous/Next
- เลขหน้า

## ไฟล์ที่สร้าง

```
src/utils/
└── api.ts (API utility functions)

src/components/pc/income/
├── ReceivingTable.tsx
├── AddReceivingModal.tsx
├── ReceivingDetailModal.tsx
├── QRCodeModal.tsx
├── PrintAllQRModal.tsx
└── Pagination.tsx

src/app/(admin)/pc/income/
└── page.tsx (อัพเดทให้ใช้ components และ API utils)
```

## API Utility Functions

สร้างไฟล์ `src/utils/api.ts` เพื่อจัดการ API endpoints:

```typescript
// ดึง API Base URL จาก environment variable
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3006';
}

// สร้าง full API URL จาก endpoint
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

// Fetch wrapper
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(endpoint);
  return fetch(url, options);
}

// Fetch และ parse JSON
export async function apiFetchJson<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(endpoint, options);
  return response.json();
}
```

### การใช้งาน:

```typescript
import { getApiUrl, apiFetch, apiFetchJson } from "@/utils/api";

// วิธีที่ 1: ใช้ getApiUrl กับ fetch
const response = await fetch(getApiUrl('/materials/all'));

// วิธีที่ 2: ใช้ apiFetch
const response = await apiFetch('/materials/all');

// วิธีที่ 3: ใช้ apiFetchJson (แนะนำ)
const data = await apiFetchJson('/materials/all');
```

## ข้อดีของการ Refactor

1. **อ่านง่าย**: แยก logic ออกเป็นส่วนๆ ชัดเจน
2. **บำรุงรักษาง่าย**: แก้ไข component ใดก็ได้โดยไม่กระทบส่วนอื่น
3. **นำกลับมาใช้ได้**: components สามารถนำไปใช้ในหน้าอื่นได้
4. **ทดสอบง่าย**: แต่ละ component สามารถทดสอบแยกกันได้
5. **ลดขนาดไฟล์**: แยกไฟล์ใหญ่ออกเป็นไฟล์เล็กๆ
6. **จัดการ API ง่าย**: ใช้ environment variables แทน hardcoded URLs
7. **เปลี่ยน environment ง่าย**: แค่แก้ไข .env ไม่ต้องแก้โค้ด

## Environment Variables

ตั้งค่าใน `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3006
NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT=/auth/login
```

สำหรับ production หรือ LAN:
```env
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.100:3006
```

## การปรับปรุงเพิ่มเติม

- ใช้ `getSession()` แทน `localStorage.getItem('session')` เพื่อตรวจสอบ session timeout
- แยก logic การ fetch API ออกเป็น custom hooks
- เพิ่ม TypeScript interfaces สำหรับ props
- เพิ่ม error handling ที่ดีขึ้น
