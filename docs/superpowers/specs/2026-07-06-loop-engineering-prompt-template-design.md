# Loop Engineering Prompt Template Design

## Objective

สร้าง Prompt มาตรฐานกลางสำหรับมอบหมายงานให้ AI ในโครงการ CCI Frontend โดยใช้ Prompt หลักชุดเดียวและปรับรายละเอียดผ่านช่องกรอกตามประเภทงาน

## Scope

- สร้างไฟล์ `.project-ai/prompt-template.md` เป็นแหล่งอ้างอิงหลัก
- รองรับงาน `Feature`, `Bug Fix`, `Refactor`, `API`, `UI`, `Test`, `Documentation` และ `Review`
- บังคับ workflow `UNDERSTAND -> PLAN -> IMPLEMENT -> VERIFY -> REFLECT`
- อ้างอิง `AGENTS.md` และเอกสาร `.project-ai/*` ที่เกี่ยวข้อง
- เพิ่มลิงก์จาก `.project-ai/loop-engineering.md` ไปยัง Prompt มาตรฐาน

## Template Structure

Prompt จะแบ่งเป็นส่วนต่อไปนี้:

1. **Task Input**: ประเภทงาน เป้าหมาย ปัญหา ขอบเขต เกณฑ์สำเร็จ และข้อจำกัด
2. **Mandatory Context**: เอกสารและ source files ที่ AI ต้องอ่านก่อนเริ่มงาน
3. **Loop Workflow**: ผลลัพธ์ที่ต้องรายงานในแต่ละ phase
4. **Project Guardrails**: กฎสำคัญจาก `AGENTS.md` และ `.project-ai/coding-rules.md`
5. **Verification**: `pnpm build` เป็นขั้นต่ำ พร้อมคำสั่งเพิ่มเติมตามผลกระทบ
6. **Final Response**: ไฟล์ที่เปลี่ยน ผลตรวจสอบ ผลกระทบ และข้อจำกัดที่ยังเหลือ

## Behavior

- AI ต้องแทนค่าช่องกรอกก่อนเริ่มงาน และถามเฉพาะข้อมูลที่จำเป็นจริง ๆ
- AI ต้องหยุดก่อนแก้ไข หากข้อกำหนดขัดแย้ง คลุมเครือ หรือเสี่ยงกระทบ business logic
- AI ต้องเปลี่ยนเฉพาะไฟล์ที่อยู่ในขอบเขต และห้าม refactor ส่วนที่ไม่เกี่ยวข้อง
- หาก verification บางรายการทำไม่ได้ ต้องระบุเหตุผลอย่างชัดเจน ห้ามรายงานว่าเสร็จสมบูรณ์โดยไม่มีหลักฐาน

## Validation

- ตรวจว่า Prompt ครบทั้ง 5 phases และไม่มี placeholder ที่อธิบายไม่ชัด
- ตรวจว่า guardrails ไม่ขัดกับ `AGENTS.md`
- ตรวจ Markdown formatting และลิงก์อ้างอิง
- รัน `pnpm build` หลังเพิ่มเอกสารตามข้อกำหนดของโครงการ

## Out of Scope

- ไม่สร้าง Prompt แยกหลายไฟล์ตามประเภทงาน
- ไม่เปลี่ยน business logic, source code, API contract หรือ project configuration
- ไม่เพิ่ม dependency ใหม่
