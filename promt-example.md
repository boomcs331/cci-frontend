ตัวอย่างที่ 1: เพิ่ม Feature ใหม่

ทำตาม Loop Engineering workflow ทั้ง 5 ขั้นตอน

งาน: เพิ่มปุ่ม Export PDF ในหน้า Production Orders

รายละเอียด:
- ต้องการปุ่ม Export PDF ที่สามารถ export รายการ production orders ทั้งหมดในหน้า
- ต้องกรองตาม filter ที่ user เลือก
- ต้องมี permission check (PERMISSIONS.PRODUCTION_ORDERS_EXPORT)
- ใช้ jsPDF และ jspdf-autotable ที่มีอยู่แล้ว

เริ่ม Phase 1: UNDERSTAND

===========================================================================================

ตัวอย่างที่ 2: แก้ Bug

ทำตาม Loop Engineering workflow ทั้ง 5 ขั้นตอน

งาน: แก้ Bug - หน้า Schedule Reservations โหลดข้อมูลไม่หมด

รายละเอียด:
- เมื่อ filter ตาม date range ข้อมูลแสดงไม่ครบ
- Backend API ส่งข้อมูลมาครบแต่ frontend แสดงไม่หมด
- ต้องตรวจสอบ logic ใน useEffect และ data fetching

เริ่ม Phase 1: UNDERSTAND

===========================================================================================

ตัวอย่างที่ 3: สร้างหน้าใหม่
ทำตาม Loop Engineering workflow ทั้ง 5 ขั้นตอน

งาน: สร้างหน้า Material Stock Report

รายละเอียด:
- Path: /pc/stock/report
- แสดงรายงานสต็อกวัตถุดิบแบบ table
- มี filter ตาม material category และ date range
- ต้องมี permission: PERMISSIONS.MATERIAL_STOCK_REPORT
- ใช้ apiFetch เพื่อดึงข้อมูลจาก backend
- ใช้ shared Table component ที่มีอยู่

เริ่ม Phase 1: UNDERSTAND

===========================================================================================

ตัวอย่างที่ 4: Refactor Code

ทำตาม Loop Engineering workflow ทั้ง 5 ขั้นตอน

งาน: Refactor - ย้าย logic จาก component ไป service

รายละเอียด:
- ไฟล์: src/app/(admin)/pc/schedule/reservations/page.tsx
- ย้าย function `fetchReservations` ไปสร้าง service file ใหม่
- ใช้ pattern เดียวกับ productionOrdersService.ts
- ไม่เปลี่ยน business logic
- อัปเดท component ให้เรียกใช้ service ใหม่

เริ่ม Phase 1: UNDERSTAND

===========================================================================================

ตัวอย่างที่ 5: อัปเดต UI
ทำตาม Loop Engineering workflow ทั้ง 5 ขั้นตอน

งาน: อัปเดต UI ของ KpiLinkCard ในหน้า Dashboard

รายละเอียด:
- เปลี่ยน style ให้เป็นแบบ modern gradient
- เพิ่ม hover effect
- เพิ่ม gradient border top
- ไม่เปลี่ยน business logic, data fetching, หรือ component signature
- เปลี่ยนเฉพาะ className และ JSX structure

เริ่ม Phase 1: UNDERSTAND