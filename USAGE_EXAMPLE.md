# Usage Example - Profile Session Integration

## 🚀 วิธีใช้งานระบบใหม่

### 1. **เริ่มต้นระบบ**

#### **เริ่ม API Server**
```bash
# ติดตั้ง dependencies
npm install express cors

# เริ่ม API server (port 3006)
node server-profile.js
```

#### **เริ่ม Frontend**
```bash
# เริ่ม Next.js development server (port 3001)
npm run dev
```

### 2. **ทดสอบการ Login**

#### **Login ด้วยบัญชี Admin**
```
Username: admin
Password: admin123

Expected Result:
- ได้ข้อมูล profile ครบถ้วน
- เมนู Admin จะแสดง (User Management, System Settings, Security Logs)
- Permissions: 14 รายการ
```

#### **Login ด้วยบัญชี User**
```
Username: user
Password: user123

Expected Result:
- ได้ข้อมูล profile พื้นฐาน
- เมนู Admin จะซ่อน
- Permissions: 6 รายการ
```

### 3. **ตรวจสอบข้อมูลใน Browser**

#### **Console Logs**
เปิด Developer Tools > Console จะเห็น:
```
🔄 Fetching complete user profile from API...
✅ Profile data fetched from API: {id: "1", username: "admin", ...}
✅ Complete profile and permissions updated from API
🔍 AppSidebar - User roles: ["admin"]
🔍 AppSidebar - API permissions: ["read", "write", "admin", ...]
🔍 AppSidebar - Profile permissions: ["read", "write", "admin", ...]
🔍 AppSidebar - Final permissions: ["read", "write", "admin", ...]
```

#### **localStorage Data**
เปิด Developer Tools > Application > Local Storage:
```javascript
// ข้อมูลผู้ใช้ที่ merge แล้ว
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

// สิทธิ์จาก API
permissions: [
  "read", "write", "delete", "admin",
  "user_management", "system_settings",
  "reports", "analytics", "calendar",
  "forms", "tables", "charts", "ui_elements"
]

// ข้อมูล profile ดิบจาก API
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

// Token สำหรับ API calls
auth_token: "jwt-token-1-1734012345678"
```

### 4. **ทดสอบ Menu Filtering**

#### **Admin User (admin/admin123)**
เมนูที่ควรเห็น:
```
Menu:
├── Dashboard ✅
├── Calendar ✅
├── User Profile ✅
├── Forms ✅
└── Tables ✅

Others:
├── Charts ✅
├── UI Elements ✅
└── Authentication ✅

Admin: (แสดงเฉพาะ admin)
├── User Management ✅
├── System Settings ✅
└── Security Logs ✅
```

#### **Regular User (user/user123)**
เมนูที่ควรเห็น:
```
Menu:
├── Dashboard ✅
├── Calendar ✅
├── User Profile ✅
├── Forms ✅
└── Tables ✅

Others:
├── UI Elements ✅
└── Authentication ✅

Admin: (ซ่อนทั้งหมด)
❌ ไม่แสดงเมนู Admin
```

### 5. **ทดสอบ Profile Page**

#### **เข้าหน้า Profile**
1. ไปที่ `/profile`
2. ดูข้อมูลพื้นฐาน (UserMetaCard, UserInfoCard, UserAddressCard)
3. คลิก "🔑 Permissions" เพื่อดูสิทธิ์
4. ทดสอบปุ่ม "🔄 Refresh" เพื่ออัปเดตสิทธิ์

#### **ข้อมูลที่ควรเห็น**
```
Profile Tab:
- User Meta Card (ข้อมูลพื้นฐาน)
- User Info Card (ข้อมูลส่วนตัว)
- User Address Card (ข้อมูลที่อยู่)

Permissions Tab:
- User Permissions (สิทธิ์ปัจจุบัน)
- Roles (บทบาท)
- Permissions List (รายการสิทธิ์)
- API Data (ข้อมูลจาก API)
```

### 6. **ทดสอบ Offline Mode**

#### **ปิด API Server**
```bash
# หยุด API server
Ctrl + C
```

#### **Login ด้วย Mock Data**
```
Username: admin
Password: admin123

Expected Result:
- ใช้ mock data แทน API
- เมนูแสดงตาม role permissions
- แสดงข้อความ "โหมดทดสอบ"
```

### 7. **ทดสอบ Session Persistence**

#### **Refresh หน้า**
1. Login สำเร็จ
2. Refresh หน้าเว็บ (F5)
3. ตรวจสอบว่าเมนูยังแสดงถูกต้อง
4. ตรวจสอบว่าข้อมูล profile ยังอยู่

#### **เปิดแท็บใหม่**
1. Login ในแท็บแรก
2. เปิดแท็บใหม่ไปที่ localhost:3001
3. ตรวจสอบว่า auto-login และเมนูแสดงถูกต้อง

### 8. **ทดสอบ API Integration**

#### **Manual API Test**
```javascript
// ใน browser console
fetch('http://localhost:3006/auth/profile/1')
  .then(r => r.json())
  .then(data => console.log('API Response:', data));
```

#### **Expected API Response**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "username": "admin",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "roles": ["admin"],
    "permissions": [
      "read", "write", "delete", "admin",
      "user_management", "system_settings",
      "reports", "analytics", "calendar",
      "forms", "tables", "charts", "ui_elements"
    ],
    "profile": {
      "department": "IT Department",
      "position": "System Administrator",
      "avatar": "/images/admin-avatar.jpg",
      "lastLogin": "2024-12-12T10:30:00Z"
    }
  }
}
```

## 🔧 Troubleshooting

### **ปัญหา: เมนูไม่แสดงถูกต้อง**
```javascript
// ตรวจสอบข้อมูลใน console
console.log('User:', localStorage.getItem('user'));
console.log('Permissions:', localStorage.getItem('permissions'));
console.log('Profile:', localStorage.getItem('user_profile'));
```

### **ปัญหา: API ไม่ทำงาน**
```bash
# ตรวจสอบ API server
curl http://localhost:3006/health

# ตรวจสอบ port
netstat -ano | findstr :3006
```

### **ปัญหา: Session หาย**
```javascript
// ล้าง session และ login ใหม่
localStorage.clear();
// จากนั้น login ใหม่
```

### **ปัญหา: Permissions ไม่อัปเดต**
```javascript
// ใช้ refresh function
const { refreshProfile } = useAuth();
await refreshProfile();
```

## 📊 Performance Monitoring

### **Network Tab**
ตรวจสอบ API calls:
```
POST /auth/login - Login request
GET /auth/profile/1 - Profile request
GET /health - Health check
```

### **Console Performance**
```javascript
// วัดเวลา login process
console.time('Login Process');
// ... login ...
console.timeEnd('Login Process');
```

## ✅ Success Criteria

- ✅ Login ได้ทั้ง online และ offline mode
- ✅ ได้ข้อมูล profile ครบถ้วนจาก API
- ✅ เมนูแสดงตามสิทธิ์จริง
- ✅ Session persistence ทำงานถูกต้อง
- ✅ Profile page แสดงข้อมูลครบถ้วน
- ✅ Refresh permissions ทำงานได้
- ✅ Debug logging ช่วยใน troubleshooting