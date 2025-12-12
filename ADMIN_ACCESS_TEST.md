# Admin Access Test Guide

## 🧪 วิธีทดสอบ Admin Full Access

### 1. **เริ่มต้นระบบ**

```bash
# Terminal 1: เริ่ม API Server
node server-profile.js
# ควรเห็น: 🚀 Profile API Server running on http://localhost:3006

# Terminal 2: เริ่ม Frontend
npm run dev
# ควรเห็น: ▲ Next.js 14.x.x ready on http://localhost:3001
```

### 2. **ทดสอบ Admin Login**

#### **Login Steps**
1. ไปที่ http://localhost:3001
2. กรอก Username: `admin`
3. กรอก Password: `admin123`
4. คลิก "เข้าสู่ระบบ"

#### **Expected Results**
```
✅ Login สำเร็จ
✅ Redirect ไป /dashboard
✅ เห็นเมนูทั้งหมดใน Sidebar
✅ เห็น Admin section (สีแดง)
```

### 3. **ตรวจสอบ Console Logs**

เปิด Developer Tools > Console ควรเห็น:

```javascript
// Login process
🔄 Fetching complete user profile from API...
✅ Profile data fetched from API: {id: "1", username: "admin", ...}
✅ Complete profile and permissions updated from API

// Sidebar rendering
🔍 AppSidebar - User roles: ["admin"]
🔍 AppSidebar - API permissions: ["read", "write", "admin", ...]
🔍 AppSidebar - Profile permissions: ["read", "write", "admin", ...]
🔍 AppSidebar - Final permissions: ["read", "write", "admin", ...]
🔓 Admin user - showing all menu items

// Menu access logs
🔓 Admin access granted for menu: calendar
🔓 Admin access granted for menu: forms
🔓 Admin access granted for menu: tables
🔓 Admin access granted for menu: charts
🔓 Admin access granted for menu: user-management
🔓 Admin access granted for menu: system-settings
🔓 Admin access granted for menu: security-logs
```

### 4. **ตรวจสอบ Menu Visibility**

#### **Main Menu Section**
```
✅ Dashboard (Ecommerce)
✅ Calendar
✅ User Profile
✅ Forms (Form Elements)
✅ Tables (Basic Tables)
✅ Pages (Blank Page, 404 Error)
```

#### **Others Section**
```
✅ Charts (Line Chart, Bar Chart)
✅ UI Elements (Alerts, Avatar, Badge, Buttons, Images, Videos)
✅ Authentication (Sign In, Sign Up)
```

#### **Admin Section (สีแดง)**
```
✅ User Management (All Users, Roles & Permissions)
✅ System Settings
✅ Security Logs
```

### 5. **ทดสอบ Menu Navigation**

#### **คลิกทดสอบเมนูต่างๆ**
```bash
# Basic menus
/dashboard ✅ ควรเข้าได้
/calendar ✅ ควรเข้าได้
/profile ✅ ควรเข้าได้

# Form menus
/form-elements ✅ ควรเข้าได้

# Table menus
/basic-tables ✅ ควรเข้าได้

# Chart menus
/line-chart ✅ ควรเข้าได้
/bar-chart ✅ ควรเข้าได้

# Admin menus
/admin/users ✅ ควรเข้าได้
/admin/settings ✅ ควรเข้าได้
/security-logs ✅ ควรเข้าได้
```

### 6. **ตรวจสอบ localStorage Data**

เปิด Developer Tools > Application > Local Storage:

```javascript
// User data (merged with profile)
user: {
  "id": "1",
  "username": "admin",
  "email": "admin@example.com",
  "firstName": "Admin",
  "lastName": "User",
  "roles": ["admin"],
  "department": "IT Department",
  "position": "System Administrator"
}

// Permissions from API
permissions: [
  "read", "write", "delete", "admin",
  "user_management", "system_settings",
  "reports", "analytics", "calendar",
  "forms", "tables", "charts", "ui_elements"
]

// Profile data from API
user_profile: {
  "id": "1",
  "username": "admin",
  "permissions": [...],
  "profile": {
    "department": "IT Department",
    "position": "System Administrator",
    "lastLogin": "2024-12-12T10:30:00Z"
  }
}
```

### 7. **เปรียบเทียบกับ Non-Admin User**

#### **Login ด้วย User Account**
```
Username: user
Password: user123
```

#### **Expected Differences**
```
❌ ไม่เห็น Admin section
❌ ไม่เห็น Charts menu (ถ้าไม่มี permission)
❌ ไม่เห็น Calendar menu (ถ้าไม่มี permission)
✅ เห็นเฉพาะเมนูที่มีสิทธิ์
```

#### **Console Logs สำหรับ User**
```javascript
🔍 AppSidebar - User roles: ["user"]
🔍 AppSidebar - Final permissions: ["read", "write", "calendar", "forms", "tables", "ui_elements"]
// ไม่มี "🔓 Admin user - showing all menu items"
// ไม่มี "🔓 Admin access granted" logs
```

### 8. **ทดสอบ Profile Page**

#### **เข้าหน้า Profile**
1. คลิก "User Profile" ใน sidebar
2. หรือไปที่ `/profile`

#### **ทดสอบ Permissions View**
1. คลิกปุ่ม "🔑 Permissions"
2. ควรเห็นข้อมูลสิทธิ์ครบถ้วน
3. ทดสอบปุ่ม "🔄 Refresh"

#### **Expected Data**
```
Roles: admin (1 รายการ)
Permissions: 14 รายการ
- อ่าน, เขียน, ลบ, ผู้ดูแลระบบ
- จัดการผู้ใช้, ตั้งค่าระบบ
- รายงาน, วิเคราะห์ข้อมูล
- ปฏิทิน, แบบฟอร์ม, ตาราง
- กราฟ, องค์ประกอบ UI
```

### 9. **ทดสอบ API Offline Mode**

#### **หยุด API Server**
```bash
# ใน Terminal ที่รัน server-profile.js
Ctrl + C
```

#### **Login ด้วย Mock Data**
```
Username: admin
Password: admin123

Expected Result:
✅ Login สำเร็จ (โหมดทดสอบ)
✅ เห็นเมนูตาม role permissions
✅ แสดงข้อความ "โหมดทดสอบ"
```

### 10. **Performance Test**

#### **วัดเวลา Menu Rendering**
```javascript
// ใน browser console
console.time('Menu Render');
// Refresh หน้า
console.timeEnd('Menu Render');

// Admin user ควรเร็วกว่า (ไม่ต้องกรองเมนู)
```

## 🔍 Troubleshooting

### **ปัญหา: Admin ไม่เห็นเมนูทั้งหมด**

#### **ตรวจสอบ**
```javascript
// 1. ตรวจสอบ user roles
const user = JSON.parse(localStorage.getItem('user'));
console.log('User roles:', user.roles);
console.log('Has admin role:', user.roles?.includes('admin'));

// 2. ตรวจสอบ permissions
const permissions = JSON.parse(localStorage.getItem('permissions'));
console.log('Permissions:', permissions);
console.log('Has admin permission:', permissions?.includes('admin'));

// 3. ตรวจสอบ isAdminUser
// ดูใน console logs ว่ามี "🔓 Admin user - showing all menu items" หรือไม่
```

#### **แก้ไข**
```bash
# 1. ล้าง localStorage และ login ใหม่
localStorage.clear();

# 2. ตรวจสอบ API server ทำงานหรือไม่
curl http://localhost:3006/auth/profile/1

# 3. ตรวจสอบ API response
fetch('http://localhost:3006/auth/profile/1')
  .then(r => r.json())
  .then(console.log);
```

### **ปัญหา: Console ไม่มี Admin Logs**

#### **สาเหตุที่เป็นไปได้**
1. User ไม่มี admin role
2. Permissions ไม่มี 'admin'
3. isAdminUser = false
4. API ไม่ส่งข้อมูลถูกต้อง

#### **วิธีแก้**
```javascript
// ตรวจสอบทีละขั้นตอน
console.log('Step 1 - User data:', localStorage.getItem('user'));
console.log('Step 2 - Permissions:', localStorage.getItem('permissions'));
console.log('Step 3 - Profile data:', localStorage.getItem('user_profile'));
```

### **ปัญหา: API Server ไม่ทำงาน**

#### **ตรวจสอบ**
```bash
# 1. ตรวจสอบ port
netstat -ano | findstr :3006

# 2. ทดสอบ health endpoint
curl http://localhost:3006/health

# 3. ตรวจสอบ logs
# ดู console ของ API server
```

## ✅ Success Criteria

เมื่อทดสอบเสร็จควรได้ผลลัพธ์:

- ✅ Admin login สำเร็จ
- ✅ เห็นเมนูทั้งหมด (รวม Admin section)
- ✅ Console มี admin bypass logs
- ✅ Navigation ไปทุกเมนูได้
- ✅ Profile page แสดงสิทธิ์ครบถ้วน
- ✅ localStorage มีข้อมูลถูกต้อง
- ✅ Performance ดี (admin ไม่ต้องรอกรองเมนู)
- ✅ Non-admin user ยังคงถูกจำกัดสิทธิ์