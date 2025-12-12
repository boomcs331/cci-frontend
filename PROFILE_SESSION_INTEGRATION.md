# Profile Session Integration

## 🎯 เป้าหมาย
ให้ระบบ get profile จาก API หลังจาก login สำเร็จ และ set ข้อมูลไว้ใน session เพื่อใช้ในการควบคุมเมนู

## 🔄 การเปลี่ยนแปลง

### 1. **อัปเดต useAuth Hook**

#### **Enhanced Login Process**
```typescript
// เดิม - เพียงแค่ get permissions
const permissionResult = await updateUserPermissionsFromApi(userData.id, token);

// ใหม่ - get complete profile data
const profileResult = await getUserProfileApi(userData.id, token);

if (profileResult.success && profileResult.data) {
  // Update user data with profile information
  const updatedUser = {
    ...userData,
    ...profileResult.data,
    // Keep original login data
    id: userData.id,
    username: userData.username,
    email: userData.email
  };
  
  // Store profile data separately
  localStorage.setItem('user_profile', JSON.stringify(profileResult.data));
}
```

#### **New Functions Added**
```typescript
// Refresh complete profile
const refreshProfile = useCallback(async () => {
  // Get fresh profile data from API
  // Update session with complete data
  // Store profile data in localStorage
}, [user, permissions]);

// Get stored profile data
const getStoredProfile = useCallback(() => {
  // Return parsed profile data from localStorage
}, []);
```

### 2. **อัปเดต auth.ts Library**

#### **Profile Management Functions**
```typescript
// Get stored profile data
export function getStoredUserProfile(): any | null

// Save profile data to localStorage
export function saveUserProfile(profileData: any): void

// Update user session with profile data
export function updateUserWithProfile(profileData: any): boolean

// Clear profile data on logout
export function clearSession(): void {
  // Also removes 'user_profile' from localStorage
}
```

### 3. **อัปเดต AppSidebar**

#### **Enhanced Permission Resolution**
```typescript
// Get stored profile for additional data
const storedProfile = getStoredProfile ? getStoredProfile() : getStoredUserProfile();

// Multi-source role resolution
const userRoles: Role[] = Array.isArray(user?.roles) 
  ? (user.roles as Role[]) 
  : storedProfile?.roles 
  ? Array.isArray(storedProfile.roles) 
    ? storedProfile.roles 
    : [storedProfile.roles]
  : [];

// Multi-source permission resolution
const userPermissions: Permission[] = [
  // Priority: API permissions > Profile permissions > Role permissions
  ...apiPermissions as Permission[],
  ...profilePermissions as Permission[],
  ...rolePermissions
];
```

## 🔄 Data Flow

### **Login Process**
```
1. User submits login credentials
2. Call loginApi() → get basic user data + token
3. Call getUserProfileApi() → get complete profile data
4. Merge login data + profile data
5. Save to session:
   - localStorage['user'] = merged user data
   - localStorage['permissions'] = profile permissions
   - localStorage['user_profile'] = raw profile data
6. Update UI state
```

### **Menu Control Process**
```
1. AppSidebar loads
2. Get user data from useAuth()
3. Get stored profile data from localStorage
4. Resolve permissions from multiple sources:
   - API permissions (highest priority)
   - Profile permissions
   - Role-based permissions
5. Filter menu items based on resolved permissions
6. Render filtered menu
```

### **Session Management**
```
Session Data Structure:
├── localStorage['user'] = {
│   id, username, email,
│   firstName, lastName, roles,
│   ...profileData
│ }
├── localStorage['permissions'] = [array of permissions]
├── localStorage['auth_token'] = "jwt-token"
└── localStorage['user_profile'] = {
    raw profile data from API
  }
```

## 🎯 ข้อดี

### 1. **Complete User Data**
- ได้ข้อมูลผู้ใช้ครบถ้วนจาก API
- รวมข้อมูล profile เพิ่มเติม (department, position, etc.)
- ข้อมูลสิทธิ์ที่แม่นยำจาก API

### 2. **Robust Permission System**
- Multi-source permission resolution
- API permissions มี priority สูงสุด
- Fallback ไปยัง profile และ role permissions
- Real-time menu filtering

### 3. **Session Persistence**
- เก็บข้อมูล profile ไว้ใน localStorage
- ไม่ต้อง call API ทุกครั้งที่โหลดหน้า
- Refresh ได้เมื่อต้องการ

### 4. **Menu Control**
- เมนูแสดงตามสิทธิ์จริงจาก API
- Dynamic filtering based on user permissions
- Admin menu แสดงเฉพาะ admin users

## 🧪 การทดสอบ

### 1. **ทดสอบ Login Process**
```bash
# เริ่ม API server
node server-profile.js

# Login ด้วยบัญชีต่างๆ
# admin/admin123 - ควรได้ 14 permissions
# user/user123 - ควรได้ 6 permissions
# manager/manager123 - ควรได้ 9 permissions
```

### 2. **ทดสอบ Menu Filtering**
```javascript
// ตรวจสอบใน browser console
console.log('User roles:', localStorage.getItem('user'));
console.log('Permissions:', localStorage.getItem('permissions'));
console.log('Profile data:', localStorage.getItem('user_profile'));
```

### 3. **ทดสอบ Session Persistence**
1. Login แล้ว refresh หน้า
2. ตรวจสอบว่าเมนูยังแสดงถูกต้อง
3. ตรวจสอบว่าข้อมูล profile ยังอยู่

### 4. **ทดสอบ API Offline**
1. ปิด API server
2. Login ด้วย mock data
3. ตรวจสอบว่าเมนูแสดงตาม role permissions

## 🔍 Debug Information

### **Console Logs**
```javascript
// ใน AppSidebar
🔍 AppSidebar - User roles: ['admin']
🔍 AppSidebar - API permissions: ['read', 'write', 'admin', ...]
🔍 AppSidebar - Profile permissions: ['read', 'write', 'admin', ...]
🔍 AppSidebar - Final permissions: ['read', 'write', 'admin', ...]

// ใน useAuth
🔄 Fetching complete user profile from API...
✅ Profile data fetched from API: { id: '1', permissions: [...] }
✅ Complete profile and permissions updated from API
```

### **localStorage Inspection**
```javascript
// ตรวจสอบข้อมูลใน localStorage
Object.keys(localStorage).filter(key => 
  ['user', 'permissions', 'auth_token', 'user_profile'].includes(key)
).forEach(key => {
  console.log(key, localStorage.getItem(key));
});
```

## 📝 API Requirements

### **Profile API Response Format**
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

## ✅ ผลลัพธ์

- ✅ Login แล้วได้ข้อมูล profile ครบถ้วน
- ✅ Session เก็บข้อมูลสิทธิ์จาก API
- ✅ เมนูแสดงตามสิทธิ์จริงจาก API
- ✅ รองรับทั้ง online และ offline mode
- ✅ Multi-source permission resolution
- ✅ Session persistence และ refresh ได้
- ✅ Debug logging สำหรับ troubleshooting