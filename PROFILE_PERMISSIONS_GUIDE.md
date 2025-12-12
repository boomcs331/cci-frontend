# Profile Permissions Guide

## 🎯 Overview
หน้า Profile ได้รับการอัปเดตให้แสดงข้อมูลสิทธิ์อย่างละเอียดจาก API `http://localhost:3006/auth/profile/:id`

## 📱 หน้า Profile ใหม่

### 🔗 การเข้าถึง
- **Sidebar Menu**: User Profile
- **User Dropdown**: Edit profile, Account settings, Support
- **Sidebar Widget**: ปุ่มโปรไฟล์
- **Direct URL**: `/profile` (ใน admin layout)

### 🎨 คุณสมบัติหลัก

#### 🔄 **Toggle View**
- ปุ่มสลับระหว่าง "ข้อมูลสิทธิ์" และ "ข้อมูลทั่วไป"
- แสดงข้อมูลสิทธิ์แบบละเอียด หรือ ข้อมูลโปรไฟล์ทั่วไป

#### 1. **ข้อมูลผู้ใช้**
- รูปโปรไฟล์ (Avatar)
- ชื่อ-นามสกุล
- อีเมล
- ข้อมูลเพิ่มเติมจาก API (แผนก, ตำแหน่ง, เข้าสู่ระบบล่าสุด)

#### 2. **สิทธิ์การใช้งานปัจจุบัน**
- แสดงบทบาท (Roles) พร้อมสีแยกประเภท
- แสดงสิทธิ์ (Permissions) ทั้งหมด
- สรุปจำนวนสิทธิ์และบทบาท

#### 3. **รายละเอียดสิทธิ์**
- **บทบาท**: แสดงบทบาทพร้อมจำนวนสิทธิ์
- **สิทธิ์**: แสดงสิทธิ์ทั้งหมดในรูปแบบ grid

#### 4. **เมทริกซ์สิทธิ์**
- ตารางแสดงสิทธิ์ตามบทบาท
- สถานะ Active/Inactive ของแต่ละบทบาท
- จำนวนสิทธิ์ของแต่ละบทบาท

#### 5. **ข้อมูลจาก API**
- แสดง Raw JSON Response จาก API
- ข้อมูลโปรไฟล์เพิ่มเติม (แผนก, ตำแหน่ง, etc.)

### 🔄 ฟังก์ชันการทำงาน

#### 1. **รีเฟรชข้อมูล**
```typescript
// ดึงข้อมูลโปรไฟล์ใหม่จาก API
const fetchProfileData = async () => {
  const response = await getUserProfileApi(user.id, token);
  // อัปเดต UI
};
```

#### 2. **อัปเดตสิทธิ์**
```typescript
// อัปเดตสิทธิ์จาก API
const handleRefreshPermissions = async () => {
  const success = await refreshPermissions();
  // รีเฟรชข้อมูลโปรไฟล์
};
```

## 🎨 UI Components

### 1. **User Info Card**
- Avatar แบบ gradient
- ข้อมูลพื้นฐาน
- ข้อมูลเพิ่มเติมจาก API

### 2. **Permissions Details**
- Current permissions พร้อม UserPermissions component
- Permissions breakdown (roles + permissions)

### 3. **Permission Matrix**
- ตารางแสดงสิทธิ์ทั้งหมด
- สถานะของแต่ละบทบาท
- จำนวนสิทธิ์

### 4. **API Data Section**
- Raw JSON response
- Collapsible details

## 🔧 การใช้งาน

### 1. **เข้าสู่ระบบ**
```bash
# เริ่ม API server
node server-profile.js

# เริ่ม frontend
npm run dev
```

### 2. **ทดสอบ**
1. Login ด้วยบัญชี admin/admin123
2. ไปที่หน้า Profile
3. ดูข้อมูลสิทธิ์ที่แสดง
4. ทดสอบปุ่ม "อัปเดตสิทธิ์"
5. ทดสอบปุ่ม "รีเฟรชข้อมูล"

### 3. **เปรียบเทียบบทบาท**
- Login ด้วย admin/admin123 - ดูสิทธิ์ 14 รายการ
- Login ด้วย user/user123 - ดูสิทธิ์ 6 รายการ
- Login ด้วย manager/manager123 - ดูสิทธิ์ 9 รายการ

## 📊 ข้อมูลที่แสดง

### จาก API Response
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
    "permissions": ["read", "write", "admin", ...],
    "profile": {
      "department": "IT Department",
      "position": "System Administrator",
      "lastLogin": "2024-12-12T10:30:00Z"
    }
  }
}
```

### ที่แสดงใน UI
- **ข้อมูลพื้นฐาน**: ID, Username, Email
- **ข้อมูลเพิ่มเติม**: แผนก, ตำแหน่ง, เข้าสู่ระบบล่าสุด
- **บทบาท**: admin, user, manager, viewer
- **สิทธิ์**: read, write, delete, admin, user_management, etc.
- **สถิติ**: จำนวนสิทธิ์, จำนวนบทบาท

## 🎯 การปรับแต่ง

### 1. **เพิ่มข้อมูลโปรไฟล์**
```typescript
// ใน server-profile.js
profile: {
  department: "IT Department",
  position: "System Administrator",
  avatar: "/images/admin-avatar.jpg",
  lastLogin: "2024-12-12T10:30:00Z",
  // เพิ่มข้อมูลใหม่
  phone: "+66-xxx-xxx-xxxx",
  location: "Bangkok, Thailand"
}
```

### 2. **เพิ่มสิทธิ์ใหม่**
```typescript
// ใน src/lib/permissions.ts
export type Permission = 
  | 'read' 
  | 'write'
  // เพิ่มสิทธิ์ใหม่
  | 'export'
  | 'import'
  | 'backup';
```

### 3. **ปรับแต่ง UI**
```typescript
// ใน src/app/profile/page.tsx
// เพิ่ม section ใหม่
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
  <h2>ข้อมูลเพิ่มเติม</h2>
  {/* เนื้อหาใหม่ */}
</div>
```

## 🔍 Debugging

### 1. **ตรวจสอบ API Response**
```javascript
// ใน browser console
fetch('http://localhost:3006/auth/profile/1')
  .then(r => r.json())
  .then(console.log);
```

### 2. **ตรวจสอบ Permissions**
```javascript
// ใน browser console
console.log(localStorage.getItem('permissions'));
```

### 3. **ตรวจสอบ User Data**
```javascript
// ใน browser console
console.log(localStorage.getItem('user'));
```

## 📝 Notes

- หน้า Profile จะแสดงข้อมูลจาก API แบบ real-time
- สามารถรีเฟรชสิทธิ์ได้โดยไม่ต้อง login ใหม่
- รองรับทั้ง online และ offline mode
- แสดงข้อมูลโปรไฟล์เพิ่มเติมจาก API
- UI responsive สำหรับทุกขนาดหน้าจอ