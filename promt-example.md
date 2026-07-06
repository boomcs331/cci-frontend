# ตัวอย่าง Prompt สำหรับ CCI Frontend

> ทุก prompt ควรบอกให้ AI ทำตาม `AGENTS.md` และอ่าน wiki ก่อนเริ่มงาน โดยขึ้นต้นด้วยคำสั่งเริ่ม Phase 1: UNDERSTAND

---

## ตัวอย่างที่ 1: เพิ่ม Feature ใหม่

```text
ทำตาม Loop Engineering workflow ทั้ง 5 ขั้นตอน
อ่าน docs/PROJECT-WIKI.md และ docs/frontend-api-wiki.md ก่อนเริ่ม

งาน: เพิ่มปุ่ม Export PDF ในหน้า Production Orders

รายละเอียด:
- ต้องการปุ่ม Export PDF ที่สามารถ export รายการ production orders ทั้งหมดในหน้า
- ต้องกรองตาม filter ที่ user เลือก
- ต้องมี permission check (PERMISSIONS.PRODUCTION_ORDERS_EXPORT)
- ใช้ jsPDF และ jspdf-autotable ที่มีอยู่แล้ว
- ใช้ apiFetchJson จาก src/utils/api.ts
- ใช้ shared components จาก src/components/shared/
- ไม่เปลี่ยน API endpoint หรือ response shape

เริ่ม Phase 1: UNDERSTAND
```

---

## ตัวอย่างที่ 2: แก้ Bug

```text
ทำตาม Loop Engineering workflow ทั้ง 5 ขั้นตอน
อ่าน docs/PROJECT-WIKI.md และ docs/troubleshooting.md ก่อนเริ่ม

งาน: แก้ Bug - หน้า Schedule Reservations โหลดข้อมูลไม่หมด

รายละเอียด:
- เมื่อ filter ตาม date range ข้อมูลแสดงไม่ครบ
- Backend API ส่งข้อมูลมาครบแต่ frontend แสดงไม่หมด
- ต้องตรวจสอบ logic ใน useEffect, useCallback และ data fetching
- ไม่แก้ไข API endpoint หรือ response shape
- ตรวจสอบ dependencies ของ useEffect ให้ถูกต้อง
- ใช้ shared components สำหรับ loading/error/empty states

เริ่ม Phase 1: UNDERSTAND
```

---

## ตัวอย่างที่ 3: สร้างหน้าใหม่

```text
ทำตาม Loop Engineering workflow ทั้ง 5 ขั้นตอน
อ่าน docs/PROJECT-WIKI.md และ docs/frontend-api-wiki.md ก่อนเริ่ม

งาน: สร้างหน้า Material Stock Report

รายละเอียด:
- Path: /pc/stock/report
- แสดงรายงานสต็อกวัตถุดิบแบบ table
- มี filter ตาม material category และ date range
- ต้องมี permission: PERMISSIONS.MATERIAL_STOCK_REPORT
- ใช้ apiFetch เพื่อดึงข้อมูลจาก backend
- ใช้ DataTable shared component
- เพิ่ม route ใน src/constants/routes.ts และ src/utils/accessControl.ts
- ใช้ PageContainer, PageHeader, ContentCard จาก shared components
- หากใช้ useSearchParams ให้ห่อด้วย <React.Suspense>

เริ่ม Phase 1: UNDERSTAND
```

---

## ตัวอย่างที่ 4: Refactor Code

```text
ทำตาม Loop Engineering workflow ทั้ง 5 ขั้นตอน
อ่าน docs/PROJECT-WIKI.md และ AGENTS.md ก่อนเริ่ม

งาน: Refactor - ย้าย logic จาก component ไป service

รายละเอียด:
- ไฟล์: src/app/(admin)/pc/schedule/reservations/page.tsx
- ย้าย function fetchReservations ไปสร้าง service file ใหม่
- ใช้ pattern เดียวกับ productionOrdersService.ts
- ใช้ object pattern สำหรับ service file
- ไม่เปลี่ยน business logic
- ไม่เปลี่ยน API endpoint หรือ response shape
- อัปเดท component ให้เรียกใช้ service ใหม่
- ตรวจสอบว่า apiFetch ถูกใช้ในทุกการเรียก API

เริ่ม Phase 1: UNDERSTAND
```

---

## ตัวอย่างที่ 5: อัปเดต UI

```text
ทำตาม Loop Engineering workflow ทั้ง 5 ขั้นตอน
อ่าน docs/PROJECT-WIKI.md และ docs/SHARED-COMPONENTS.md ก่อนเริ่ม

งาน: อัปเดต UI ของ KpiLinkCard ในหน้า Dashboard

รายละเอียด:
- เปลี่ยน style ให้เป็นแบบ modern gradient
- เพิ่ม hover effect
- เพิ่ม gradient border top
- ไม่เปลี่ยน business logic, data fetching, หรือ component signature
- เปลี่ยนเฉพาะ className และ JSX structure
- ใช้ Tailwind CSS 4 และ dark: prefix รองรับ dark mode
d
เริ่ม Phase 1: UNDERSTAND
```

---

## ตัวอย่างที่ 6: เพิ่ม API Integration

```text
ทำตาม Loop Engineering workflow ทั้ง 5 ขั้นตอน
อ่าน docs/frontend-api-wiki.md และ src/utils/api.ts ก่อนเริ่ม

งาน: เชื่อมต่อ API สร้าง Sales Order ใหม่

รายละเอียด:
- Backend endpoint: POST /sales/orders
- Permission: PERMISSIONS.SALES_ORDER_CREATE
- สร้าง service function ใน src/services/salesOrderService.ts
- อัปเดท modal หรือ page ที่สร้าง order ให้เรียกใช้ service
- ใช้ apiFetchJson และ handle error ด้วย publishToast
- ใช้ types จาก src/types/sales.ts
- ใช้ shared components สำหรับ form และ modal

เริ่ม Phase 1: UNDERSTAND
```

---

## ตัวอย่างที่ 7: ถามทำความเข้าใจโค้ด

> มี workflow สำเร็จรูปให้ใช้ที่ `.devin/workflows/explain-code.md` — เรียกด้วย `/explain-code` ได้เลย

```text
ช่วยอธิบายว่าไฟล์ src/app/(admin)/pc/income/page.tsx ทำงานอย่างไร
- อ่าน docs/PROJECT-WIKI.md เพื่อเข้าใจ context ก่อน
- อธิบาย flow การสร้าง Receiving
- ชี้ว่าใช้ service ไหน
- ใช้ shared components อะไรบ้าง
- มี permission อะไรบ้าง
- ไม่ต้องแก้ไขโค้ด ขอแค่อธิบาย
```

---

## ตัวอย่างที่ 8: Code Review

```text
ช่วย review โค้ดที่ฉันกำลังจะ merge ในหน้า [ชื่อหน้า]
- อ่าน AGENTS.md และ docs/PROJECT-WIKI.md ก่อน
- ตรวจสอบว่าใช้ apiFetch / apiFetchJson หรือไม่
- ตรวจสอบว่าไม่มี any type
- ตรวจสอบว่าใช้ shared components
- ตรวจสอบ try/catch/finally ในทุก async function
- ตรวจสอบว่าไม่ hardcode route หรือ permission
- ตรวจสอบว่าใช้ ROUTES.* และ PERMISSIONS.*
- ไม่ต้องแก้ไขโค้ด ขอแค่ feedback เป็น bullet points
```

---

## ตัวอย่างที่ 9: เพิ่ม E2E Test

```text
ทำตาม Loop Engineering workflow ทั้ง 5 ขั้นตอน
อ่าน docs/PROJECT-WIKI.md และ .project-ai/test-guide.md ก่อนเริ่ม

งาน: เพิ่ม E2E test สำหรับหน้า Sales Order ด้วย Playwright

รายละเอียด:
- Test file: tests/sales/orders.spec.ts
- ทดสอบ flow: login → ไปหน้า sales orders → สร้าง order → ตรวจสอบว่าแสดงใน table
- ใช้ mock หรือ test account ที่มี permission SALES_ORDER_CREATE
- ใช้ page object pattern ถ้ามี
- รัน test ด้วย pnpm test:e2e

เริ่ม Phase 1: UNDERSTAND
```

---

## Tips ในการเขียน Prompt

1. **ระบุ workflow ชัดเจน** — ทุกครั้งให้บอกให้ทำตาม Loop Engineering workflow
2. **ระบุ constraints** — เช่น ไม่เปลี่ยน API, ไม่ใช้ fetch ตรง, ใช้ shared components
3. **ระบุ path/permission** — ช่วยให้ AI หาไฟล์และตรวจสอบสิทธิ์ได้เร็วขึ้น
4. **เริ่มด้วย "เริ่ม Phase 1: UNDERSTAND"** — เพื่อให้ AI วิเคราะห์โครงการก่อนแก้ไขโค้ด
5. **อ้างอิง wiki ที่เกี่ยวข้อง** — บอกให้ AI อ่าน `docs/PROJECT-WIKI.md` หรือ `docs/frontend-api-wiki.md` ก่อนเริ่มงาน 