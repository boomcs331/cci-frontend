# สรุปโครงสร้างโปรเจกต์ CCI Frontend

วันที่วิเคราะห์: 2026-06-28

## ภาพรวม

โปรเจกต์นี้เป็น Frontend Backoffice ขนาดกลางถึงใหญ่ สร้างด้วย Next.js App Router, React, TypeScript และ Tailwind CSS โครงสร้างเริ่มจาก template dashboard แต่ถูกต่อยอดเป็นระบบงานภายในหลายโมดูลแล้ว เช่น PC, Production, Sales, Sales Planning, Master Data, Users/RBAC และ Stock/Balance

ข้อมูลจากโครงสร้างปัจจุบัน:

| หมวด | จำนวนไฟล์ TypeScript/TSX โดยประมาณ |
| --- | ---: |
| `src/app` | 106 |
| `src/components` | 140 |
| `src/services` | 15 |
| `src/utils` | 25 |
| `src/hooks` | 5 |
| `src/context` | 5 |
| `src/types` | 12 |
| `src/constants` | 4 |
| `src/lib` | 11 |
| `src/layout` | 5 |
| `src/mocks` | 3 |

มีหน้า route จาก `page.tsx` ประมาณ 95 หน้า แสดงว่า scope ของระบบใหญ่กว่าหน้า dashboard ทั่วไปแล้ว

## Technology Stack

- Framework: Next.js 16 App Router
- UI: React 19, Tailwind CSS 4, MUI บางส่วน, FontAwesome, custom components
- Language: TypeScript strict mode
- Charts/visual: ApexCharts, react-apexcharts, jsvectormap
- Date/time: dayjs, MUI date pickers, FullCalendar
- Export/print: jsPDF, jspdf-autotable, xlsx, QR code
- Test: Playwright visual regression
- Mock API: MSW เปิดใช้เมื่อ `NEXT_PUBLIC_MOCK_API=1`
- Package manager: pnpm

## โครงสร้างระดับบนสุด

```text
.
├── docs/                  # เอกสารประกอบระบบและแนวทางแก้ปัญหา
├── public/                # static assets, fonts, MSW worker, images
├── scripts/               # script ช่วย generate routes และงาน setup บางส่วน
├── Setup/                 # batch/script สำหรับ run แบบ LAN และคู่มือ setup
├── src/                   # source code หลักของ frontend
├── tests/                 # Playwright visual tests และ route fixture
├── next.config.ts         # Next.js config และ proxy rewrite ไป backend
├── package.json           # scripts และ dependencies
├── playwright.config.ts   # config visual regression test
└── tsconfig.json          # TypeScript config และ alias `@/*`
```

## โครงสร้าง `src`

```text
src/
├── app/                   # routes, layouts, loading/error ของ Next.js App Router
├── components/            # component แยกตาม domain และ UI primitive
├── constants/             # route, permission, status constants
├── context/               # React context เช่น sidebar, theme, toast, page title
├── hooks/                 # custom hooks
├── icons/                 # icon exports
├── layout/                # AppHeader, AppSidebar, Backdrop, layout widget
├── lib/                   # helper เฉพาะ domain โดยเฉพาะ PC
├── mocks/                 # MSW browser/handlers/loader
├── services/              # service layer สำหรับเรียก backend API
├── types/                 # shared TypeScript types
└── utils/                 # utility หลัก เช่น API, session, access control, export
```

## Routing และ Layout

โปรเจกต์ใช้ App Router และแบ่ง route group ชัดเจน:

- `src/app/(admin)` เป็นกลุ่มหน้าหลังบ้านที่ใช้ layout หลัก มี sidebar, header, toast, session guard และ floating stock quick check
- `src/app/(full-width-pages)/(auth)` เป็นหน้าที่ไม่ใช้ layout admin เช่น signin, signup, select department
- `src/app/(full-width-pages)/(error-pages)` เป็นหน้า error แบบ full width
- `src/app/ai/chat` เป็น route แยกสำหรับ AI chat

กลุ่ม route หลักภายใต้ admin:

- Dashboard: `/`
- PC: `/pc`, `/pc/income`, `/pc/outcome`, `/pc/schedule`, `/pc/stock`, `/pc/report`, `/pc/traceability`
- Production: `/production/overview`, `/production/production-orders`, `/production/products`, `/production/dept-step-scan`
- Sales: `/sales/dashboard`, `/sales/orders`, `/sales/approvals`, `/sales/import`, `/sales/reports`
- Sales Planning: `/sales-planning/data`, `/sales-planning/import`
- Master Data: `/master-data/...`
- Users/RBAC: `/users`, `/users/roles`, `/users/permissions`, `/users/role-permissions`
- Stock/Balance: `/balances/overview`

## Flow หลักของระบบ

### 1. Root Layout

`src/app/layout.tsx` ครอบระบบด้วย:

- `MswLoader` สำหรับเปิด mock API เฉพาะตอนตั้งค่า env
- `ThemeProvider`
- `SidebarProvider`
- global CSS และ Google font

### 2. Admin Layout

`src/app/(admin)/layout.tsx` เป็น client layout และทำหน้าที่:

- ตรวจ session ผ่าน `useSessionCheck()`
- แสดง `AppSidebar`, `AppHeader`, `Backdrop`
- ครอบ `ToastProvider`, `AdminOverlayProvider`, `PageTitleProvider`
- วาง `StockQuickCheckFab` ให้เข้าถึง stock quick check ได้จากหน้า admin

### 3. Sidebar และ Menu

`src/layout/AppSidebar.tsx` ไม่ได้ hardcode menu ทั้งหมดจาก frontend อย่างเดียว แต่:

- อ่าน session จาก `src/utils/session.ts`
- เรียก `/auth/menu` เพื่อโหลด menu จาก backend
- เก็บ menu ลง session ผ่าน `setSession`
- filter menu ตาม permission, department และ route policy

### 4. API Layer

`src/utils/api.ts` เป็น wrapper หลักของ fetch:

- สร้าง URL จาก `NEXT_PUBLIC_API_BASE_URL` หรือ fallback `http://localhost:3006`
- แนบ header จาก session เช่น `x-user-id`, `x-username`, `x-department-id`, `Authorization`
- มี request timeout
- redirect กลับ `/signin` เมื่อเจอ 401
- แสดง toast เมื่อเจอ 403
- `apiFetchJson()` parse JSON และ throw `ApiError` เมื่อ response ไม่ใช่ 2xx

`next.config.ts` มี rewrites:

- `/api/:path*` proxy ไป backend internal URL
- `/uploads/:path*` proxy ไป backend upload path

ข้อสังเกต: frontend บางส่วนเรียก API ผ่าน `NEXT_PUBLIC_API_BASE_URL` โดยตรง ขณะที่ Next rewrites ก็รองรับ same-origin proxy อยู่ ควรกำหนดแนวทางให้ชัดเจนว่าจะใช้แบบใดเป็นหลัก

### 5. Session และ RBAC

`src/utils/session.ts` จัดการ session ใน `localStorage`:

- เก็บ token, user, permissions, menus
- ตั้งอายุ session 1 ชั่วโมง
- รองรับผู้ใช้หลาย department
- เลือก active department และส่งต่อให้ API ผ่าน `x-department-id`

`src/constants/permissions.ts` เก็บ permission code จาก backend RBAC

`src/utils/accessControl.ts` เป็น policy กลางของ route:

- ตรวจ admin only
- ตรวจ permission แบบ all/any
- ตรวจ department gate
- ตรวจ PC module permission เพิ่มเติม

## Components

โครงสร้าง `src/components` แบ่งทั้งแบบ domain และ shared UI:

- `common`: component ใช้ซ้ำ เช่น toast, modal, skeleton, breadcrumb, QR generator
- `ui`: primitive UI เช่น table, modal, dropdown, video, images
- `form`: input, select, checkbox, date picker, switch
- `pc`: component เฉพาะ PC แบ่งเป็น income, outcome, materials, production, production-plans, shared, transactions
- `production`: component เฉพาะ production floor และ production orders
- `sales`/`dashboard`/`inventory`/`users`: component เฉพาะโมดูล
- `layout` แยกอยู่นอก `components` สำหรับ shell หลักของ app

แนวทางโดยรวมดี เพราะเริ่มแยก domain component ออกจากหน้า route แล้ว โดยเฉพาะ PC transaction components ที่มี shared card/header/filter pattern

## Services และ Types

`src/services` ทำหน้าที่เป็น service layer สำหรับ API บาง domain:

- `authService.ts`
- `authRbacService.ts`
- `materialService.ts`
- `receivingService.ts`
- `productionOrdersService.ts`
- `productionProcessesService.ts`
- `productionPlanQrService.ts`
- `productFgLotService.ts`
- `productProductionStepsService.ts`
- sales services ใน `src/services/sales/`

`src/types` เก็บ type กลาง เช่น user, material, receiving, production, API response และ type เฉพาะ production lot

ข้อสังเกต: service layer มีแล้ว แต่ยังไม่ครอบคลุมเท่ากันทุกโมดูล หน้า route ขนาดใหญ่บางไฟล์ยังน่าจะมี logic/API call อยู่ในหน้าโดยตรง

## Testing

มี Playwright visual regression:

- `tests/visual.spec.ts` วนทดสอบ route จาก `tests/routes.generated.json`
- เปิด dev server ด้วย `pnpm dev`
- ใช้ `NEXT_PUBLIC_MOCK_API=1` เพื่อเปิด MSW
- freeze เวลาและ random เพื่อลด diff ของ screenshot
- screenshot strict มาก เพราะ `maxDiffPixels: 0`

จุดนี้เป็นฐานที่ดีสำหรับตรวจ UI regression แต่ strict ระดับ pixel-identical อาจทำให้ flaky ได้ถ้า font/rendering/environment เปลี่ยน

## จุดแข็ง

- โครงสร้างหลักแยกชั้นชัดเจน: routes, components, services, utils, types, constants
- ใช้ Next.js App Router และ route groups ได้เหมาะกับ admin app
- มี service layer, type layer และ API wrapper กลางแล้ว
- ระบบ auth/session/RBAC ค่อนข้างครบ รองรับ permission และ department-based access
- มี visual regression test ครอบหลาย route
- มี mock API ผ่าน MSW สำหรับ test/dev
- มีเอกสารใน `docs` หลายไฟล์ แปลว่ามีการบันทึก decision และ troubleshooting ไว้แล้ว

## จุดที่ควรระวัง

### 1. หน้า route บางไฟล์ใหญ่เกินไป

ไฟล์ใหญ่ที่สุดที่พบ:

| ไฟล์ | ขนาดโดยประมาณ |
| --- | ---: |
| `src/app/(admin)/pc/page.tsx` | 80.8 KB |
| `src/app/(admin)/pc/schedule/page.tsx` | 76.6 KB |
| `src/app/(admin)/production/dept-step-scan/page.tsx` | 61.8 KB |
| `src/app/(admin)/production/products/page.tsx` | 54.3 KB |
| `src/app/(admin)/page.tsx` | 49.1 KB |

ไฟล์ระดับ route ที่ใหญ่ระดับนี้มักรวม state, API, validation, transform data และ UI ไว้ด้วยกัน ทำให้แก้ยากและเสี่ยง regression

### 2. Encoding ภาษาไทยในบางไฟล์เพี้ยน

พบคอมเมนต์/เอกสารบางส่วนแสดงเป็น mojibake เช่นใน `next.config.ts`, `src/utils/api.ts`, `src/utils/session.ts`, `src/utils/accessControl.ts` และเอกสารเดิม `docs/project-structure-analysis.md`

ควรตรวจ encoding ของไฟล์เหล่านี้ให้เป็น UTF-8 และระวังไม่ให้ editor แปลงซ้ำ

### 3. API strategy ยังมีสองแนว

มีทั้ง:

- `NEXT_PUBLIC_API_BASE_URL` ใน `src/utils/api.ts`
- Next.js rewrites จาก `/api/*` และ `/uploads/*`

ควรเลือก convention หลัก เช่น:

- ใช้ same-origin `/api` เป็นหลักเมื่อต้องการหลบ CORS/tunnel
- ใช้ direct backend URL เฉพาะกรณีจำเป็น

### 4. Service layer ยังไม่สม่ำเสมอทุก module

บาง domain มี service แยกดีแล้ว แต่บางหน้าขนาดใหญ่ยังควรดึง API logic ออกมาเป็น service/hook เพื่อให้ page รับผิดชอบเฉพาะ composition และ routing

### 5. Test มี visual แต่ยังไม่เห็น unit/integration test

Visual regression เหมาะกับ UI แต่ logic สำคัญ เช่น permission policy, session department selection, API error mapping และ data transform ควรมี unit test เพิ่ม

## คำแนะนำการจัดระเบียบต่อ

ลำดับที่ควรทำก่อน:

1. แยกไฟล์ route ขนาดใหญ่ออกเป็น component, hook และ service ตาม domain
2. จัด convention การเรียก API ให้ชัดเจนระหว่าง direct backend URL กับ Next rewrite
3. แก้/normalize encoding ของไฟล์ที่มีภาษาไทยเพี้ยนเป็น UTF-8
4. เพิ่ม test ให้ logic สำคัญใน `utils`, `services`, `lib`
5. ทำ README สั้น ๆ ราย module เช่น `components/pc`, `services`, `utils`

ตัวอย่างแนวทาง refactor หน้าใหญ่:

```text
src/app/(admin)/pc/schedule/page.tsx
└── ควรเหลือหน้าที่ compose page และ route-level behavior

src/components/pc/schedule/
├── ScheduleFilterPanel.tsx
├── ScheduleTable.tsx
├── ScheduleDetailModal.tsx
└── ScheduleActionBar.tsx

src/hooks/pc/
└── useProductionSchedule.ts

src/services/
└── productionScheduleService.ts

src/types/
└── productionSchedule.ts
```

## สรุป

โครงสร้างโปรเจกต์โดยรวมอยู่ในทิศทางที่ดีและมีการแยก module สำคัญไว้แล้ว จุดที่ควรโฟกัสต่อคือการลดความใหญ่ของ route pages, ทำ service/hook ให้สม่ำเสมอ, กำหนด API convention ให้ชัด และแก้ปัญหา encoding ภาษาไทย เพื่อให้ดูแลระบบระยะยาวได้ง่ายขึ้น
