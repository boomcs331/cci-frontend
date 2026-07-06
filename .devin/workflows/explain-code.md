---
description: อธิบายการทำงานของไฟล์/หน้าในโปรเจกต์ CCI Frontend โดยไม่แก้ไขโค้ด
---

1. อ่าน `docs/PROJECT-WIKI.md` เพื่อเข้าใจโครงสร้างและความสัมพันธ์ของโปรเจกต์
2. อ่านไฟล์เป้าหมายที่ผู้ใช้ระบุทั้งหมด (ใช้ `read_file`)
3. ระบุ imports ทั้งหมดของไฟล์ แล้วจัดกลุ่มเป็น:
   - Services (`src/services/*`)
   - Shared components (`src/components/shared/*`)
   - Module-specific components (`src/components/<module>/*`)
   - Utils (`src/utils/*`) และ Lib (`src/lib/*`)
   - Types (`src/types/*`)
4. หากไฟล์เรียก API ผ่าน `apiFetch` / `apiFetchJson` ให้ไล่ endpoint ทั้งหมดที่ถูกเรียก แล้วอ้างอิงกับ `docs/frontend-api-wiki.md` เพื่อสรุปว่าแต่ละ endpoint ทำอะไร
5. สรุป business flow หลักของหน้า/ไฟล์เป็นขั้นตอน (numbered list) เช่น การกรอกฟอร์ม → validate → submit → response handling
6. ตรวจสอบ permission ที่เกี่ยวข้องโดยดูจาก `src/utils/accessControl.ts` และ `src/constants/permissions.ts` (route policy หรือ permission check ในไฟล์)
7. สรุปผลลัพธ์เป็นหัวข้อดังนี้:
   - Flow การทำงานหลัก
   - Service / API ที่ใช้
   - Shared components / module components ที่ใช้
   - Permission ที่เกี่ยวข้อง
8. **ห้ามแก้ไขโค้ดใด ๆ** ในระหว่างขั้นตอนนี้ — ตอบเป็นคำอธิบายเท่านั้น
