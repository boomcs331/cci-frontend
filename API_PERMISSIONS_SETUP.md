# API Permissions System Setup

## 🎯 Overview
ระบบนี้ได้รับการอัปเดตให้ดึงสิทธิ์ผู้ใช้จาก API `http://localhost:3006/auth/profile/:id` หลังจากการ login สำเร็จ

## 🚀 Quick Start

### 1. เริ่มต้น API Server
```bash
# ติดตั้ง dependencies สำหรับ API server
npm install --prefix . express cors nodemon

# หรือใช้ package.json ที่สร้างไว้
cp package-profile-server.json package.json
npm install

# เริ่มต้น API server
node server-profile.js
```

### 2. เริ่มต้น Frontend
```bash
# ใน terminal อื่น
npm run dev
```

### 3. ทดสอบระบบ
1. เข้าไปที่ http://localhost:3001/test-api-permissions
2. ทดสอบการดึงสิทธิ์จาก API
3. ทดสอบการ login ด้วยบัญชีต่างๆ

## 📡 API Endpoints

### Login API
```
POST http://localhost:3006/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Profile API
```
GET http://localhost:3006/auth/profile/:id
Authorization: Bearer {token} (optional)
```

## 👥 Test Users

| Username | Password | Role | Permissions Count |
|----------|----------|------|-------------------|
| admin | admin123 | admin | 14 permissions |
| user | user123 | user | 6 permissions |
| test | 123456 | user | 6 permissions |
| manager | manager123 | manager | 9 permissions |
| viewer | viewer123 | viewer | 2 permissions |

## 🔄 How It Works

### 1. Login Process
1. ผู้ใช้ login ผ่าน SignInForm
2. ระบบเรียก API login และได้รับ user data + token
3. ระบบเรียก API profile เพื่อดึงสิทธิ์ล่าสุด
4. อัปเดตสิทธิ์ใน session และ UI

### 2. Permission Refresh
- ใช้ `refreshPermissions()` จาก useAuth hook
- เรียก API profile เพื่อดึงสิทธิ์ใหม่
- อัปเดต session และ UI แบบ real-time

### 3. Menu Filtering
- ระบบกรองเมนูตามสิทธิ์ที่ได้จาก API
- แสดง/ซ่อนเมนูแบบ dynamic
- รองรับ role-based และ permission-based access

## 🧪 Testing

### Test Pages
1. `/test-permissions` - ทดสอบระบบสิทธิ์พื้นฐาน
2. `/test-api-permissions` - ทดสอบการดึงสิทธิ์จาก API
3. `/admin/users` - ทดสอบ admin-only access

### Test Scenarios
1. **Online Mode**: API server ทำงาน - ใช้ข้อมูลจาก API
2. **Offline Mode**: API server ปิด - ใช้ mock data
3. **Permission Update**: ทดสอบการอัปเดตสิทธิ์แบบ real-time

## 🔧 Configuration

### API Base URL
```typescript
// src/lib/api.ts
const API_BASE_URL = 'http://localhost:3006';
```

### Mock Users (Fallback)
```typescript
// src/components/auth/SignInForm.tsx
const mockUsers = [
  {
    username: 'admin',
    password: 'admin123',
    userData: { ... }
  }
];
```

## 🛠️ Customization

### Adding New Permissions
1. อัปเดต `Permission` type ใน `src/lib/permissions.ts`
2. เพิ่ม permission ใน `ROLE_PERMISSIONS`
3. กำหนด menu permission ใน `MENU_PERMISSIONS`

### Adding New Roles
1. อัปเดต `Role` type ใน `src/lib/permissions.ts`
2. เพิ่ม role ใน `ROLE_PERMISSIONS`
3. อัปเดต mock users และ API server

### Custom API Response Format
อัปเดต `UserProfileResponse` interface ใน `src/lib/api.ts`

## 🔍 Debugging

### Check API Connection
```javascript
// ใน browser console
fetch('http://localhost:3006/health')
  .then(r => r.json())
  .then(console.log);
```

### Check Current Permissions
```javascript
// ใน browser console
console.log(localStorage.getItem('permissions'));
```

### Monitor API Calls
เปิด Network tab ใน DevTools เพื่อดู API requests

## 🚨 Troubleshooting

### API Server ไม่ทำงาน
- ตรวจสอบว่า port 3006 ว่าง
- ตรวจสอบ CORS settings
- ดู console logs ของ server

### Permissions ไม่อัปเดต
- ตรวจสอบ API response format
- ตรวจสอบ localStorage
- ใช้ `refreshPermissions()` function

### Menu ไม่แสดงถูกต้อง
- ตรวจสอบ permission mapping
- ตรวจสอบ role assignments
- ดู console logs สำหรับ permission checks

## 📝 Notes

- ระบบรองรับทั้ง online และ offline mode
- Permissions จะถูกอัปเดตทุกครั้งที่ login
- สามารถ refresh permissions ได้แบบ manual
- Menu จะถูกกรองตามสิทธิ์แบบ real-time
- รองรับ role-based และ permission-based access control