"use client";
import { useAuth } from "@/hooks/useAuth";
import { getPermissionsFromRoles, type Role, type Permission } from "@/lib/permissions";

interface UserPermissionsProps {
  showDetails?: boolean;
  className?: string;
}

export default function UserPermissions({ 
  showDetails = false, 
  className = "" 
}: UserPermissionsProps) {
  const { user, permissions, getStoredProfile } = useAuth();

  if (!user) {
    return null;
  }

  // Get stored profile for additional data
  const storedProfile = getStoredProfile ? getStoredProfile() : null;

  // Handle both simple string roles and complex API role objects
  let userRoles: string[] = [];
  let roleObjects: any[] = [];
  
  if (user?.roles) {
    if (Array.isArray(user.roles)) {
      // Check if it's array of strings or objects
      if (user.roles.length > 0 && typeof user.roles[0] === 'string') {
        userRoles = user.roles as string[];
      } else if (user.roles.length > 0 && typeof user.roles[0] === 'object') {
        // Store role objects for detailed display
        roleObjects = user.roles as any[];
        userRoles = roleObjects.map(role => role.code || role.name || String(role));
      }
    } else if (typeof user.roles === 'string') {
      userRoles = [user.roles];
    }
  }
  
  // Also check stored profile for roles
  if (storedProfile?.user?.roles && userRoles.length === 0) {
    if (Array.isArray(storedProfile.user.roles)) {
      roleObjects = storedProfile.user.roles;
      userRoles = roleObjects.map(role => role.code || role.name || String(role));
    }
  }

  // Get permissions from multiple sources
  const apiPermissions = Array.isArray(permissions) ? permissions as string[] : [];
  const profilePermissions = storedProfile?.permissions || [];
  
  // Extract permissions from API roles if available
  let roleBasedPermissions: string[] = [];
  if (roleObjects.length > 0) {
    roleObjects.forEach((role: any) => {
      if (role.permissions && Array.isArray(role.permissions)) {
        const rolePerms = role.permissions.map((perm: any) => perm.code || perm.name || String(perm));
        roleBasedPermissions.push(...rolePerms);
      }
    });
  }
  
  // Fallback to role-based permissions
  const fallbackRolePermissions = getPermissionsFromRoles(userRoles as Role[]);
  
  const userPermissions: string[] = [
    // Priority: API permissions > Profile permissions > Role-based permissions > Fallback
    ...apiPermissions,
    ...profilePermissions,
    ...roleBasedPermissions,
    ...fallbackRolePermissions.map(String)
  ];

  // Remove duplicates
  const uniquePermissions = Array.from(new Set(userPermissions));

  if (!showDetails) {
    return (
      <div className={`text-sm ${className}`}>
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Role: {userRoles.length > 0 ? userRoles.map(String).join(', ') : 'User'}
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* User Roles */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">
          🎭 บทบาท (Roles)
        </h3>
        <div className="flex flex-wrap gap-2">
          {userRoles.length > 0 ? (
            userRoles.map((role, index) => {
              const roleObj = roleObjects[index];
              const isAdmin = role.toUpperCase() === 'ADMIN' || role.toLowerCase() === 'admin';
              
              return (
                <div key={role} className="space-y-1">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      isAdmin
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : role.toUpperCase() === 'MANAGER'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    }`}
                  >
                    {String(role)}
                  </span>
                  {roleObj && roleObj.name && roleObj.name !== role && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {roleObj.name}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              ไม่มีบทบาทที่กำหนด
            </span>
          )}
        </div>
      </div>

      {/* User Permissions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">
          🔑 สิทธิ์การใช้งาน (Permissions)
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {uniquePermissions.length > 0 ? (
            uniquePermissions.map(permission => (
              <div
                key={permission}
                className="flex items-center space-x-2 text-xs"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-gray-700 dark:text-gray-300">
                  {getPermissionLabel(permission as Permission)}
                </span>
              </div>
            ))
          ) : (
            <span className="text-gray-500 dark:text-gray-400 text-xs col-span-2">
              ไม่มีสิทธิ์การใช้งาน
            </span>
          )}
        </div>
      </div>

      {/* Permission Summary */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">สรุป:</span> {uniquePermissions.length} สิทธิ์, {userRoles.length} บทบาท
        </div>
      </div>
    </div>
  );
}

// Helper function to get Thai labels for permissions
function getPermissionLabel(permission: Permission | string): string {
  const labels: Record<string, string> = {
    'read': 'อ่าน',
    'write': 'เขียน',
    'delete': 'ลบ',
    'admin': 'ผู้ดูแลระบบ',
    'user_management': 'จัดการผู้ใช้',
    'system_settings': 'ตั้งค่าระบบ',
    'reports': 'รายงาน',
    'analytics': 'วิเคราะห์ข้อมูล',
    'calendar': 'ปฏิทิน',
    'forms': 'แบบฟอร์ม',
    'tables': 'ตาราง',
    'charts': 'กราฟ',
    'ui_elements': 'องค์ประกอบ UI',
    // API permission codes
    'USER_CREATE': 'สร้างผู้ใช้',
    'USER_VIEW': 'ดูข้อมูลผู้ใช้',
    'USER_EDIT': 'แก้ไขผู้ใช้',
    'USER_DELETE': 'ลบผู้ใช้',
    'ROLE_CREATE': 'สร้างบทบาท',
    'ROLE_VIEW': 'ดูข้อมูลบทบาท',
    'ROLE_EDIT': 'แก้ไขบทบาท',
    'ROLE_DELETE': 'ลบบทบาท',
    'PERMISSION_CREATE': 'สร้างสิทธิ์',
    'PERMISSION_VIEW': 'ดูข้อมูลสิทธิ์',
    'PERMISSION_EDIT': 'แก้ไขสิทธิ์',
    'PERMISSION_DELETE': 'ลบสิทธิ์'
  };

  const permissionStr = String(permission);
  return labels[permissionStr] || permissionStr;
}