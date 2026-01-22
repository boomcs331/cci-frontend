# คู่มือการตั้งค่า Session Timeout

## สรุป
ระบบ session timeout ถูกตั้งค่าให้หมดอายุใน **1 ชั่วโมง** หลังจาก login

## ไฟล์ที่เกี่ยวข้อง

### 1. `src/utils/session.ts`
ไฟล์หลักสำหรับจัดการ session:
- `setSession()` - บันทึก session พร้อมกำหนดเวลาหมดอายุ
- `getSession()` - ดึงข้อมูล session และตรวจสอบว่าหมดอายุหรือไม่
- `clearSession()` - ลบ session
- `isSessionValid()` - ตรวจสอบว่า session ยังใช้งานได้หรือไม่
- `getUserPermissions()` - ดึง permissions จาก session
- `isAdmin()` - ตรวจสอบว่าเป็น admin หรือไม่

### 2. `src/hooks/useSessionCheck.ts`
Hook สำหรับตรวจสอบ session อัตโนมัติทุก 10 วินาที

### 3. ไฟล์ที่ถูกอัพเดท
- `src/components/auth/SignInForm.tsx` - ใช้ `setSession()` แทน localStorage
- `src/layout/AppSidebar.tsx` - ใช้ `getSession()` เพื่อตรวจสอบ expiration
- `src/components/header/UserDropdown.tsx` - ใช้ `clearSession()` เมื่อ logout
- `src/app/(admin)/session/page.tsx` - แสดงเวลาหมดอายุของ session
- `src/app/(admin)/layout.tsx` - เพิ่ม `useSessionCheck()` hook
- `src/components/ui/button/Button.tsx` - เพิ่ม support สำหรับ type prop

## การปรับเวลา Session Timeout

แก้ไขค่า `SESSION_TIMEOUT` ในไฟล์ `src/utils/session.ts`:

```typescript
// ปัจจุบัน: 1 ชั่วโมง
const SESSION_TIMEOUT = 3600000; // 1 hour = 60 * 60 * 1000 ms

// ตัวอย่าง: เปลี่ยนเป็น 1 นาที
const SESSION_TIMEOUT = 60000; // 1 minute = 60 * 1000 ms

// ตัวอย่าง: เปลี่ยนเป็น 30 นาที
const SESSION_TIMEOUT = 1800000; // 30 minutes = 30 * 60 * 1000 ms
```

## การทำงาน

1. เมื่อผู้ใช้ login สำเร็จ ระบบจะบันทึก session พร้อมเวลาหมดอายุ
2. ทุกครั้งที่เรียกใช้ `getSession()` จะตรวจสอบว่า session หมดอายุหรือไม่
3. `useSessionCheck` hook จะตรวจสอบ session ทุก 10 วินาที
4. ถ้า session หมดอายุ ระบบจะ redirect ไปหน้า signin อัตโนมัติ
