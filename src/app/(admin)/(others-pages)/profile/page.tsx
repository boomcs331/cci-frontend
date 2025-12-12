"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfileApi } from "@/lib/api";
import { getSession } from "@/lib/auth";
import UserPermissions from "@/components/auth/UserPermissions";
import { 
  getPermissionsFromRoles, 
  ROLE_PERMISSIONS,
  type Role, 
  type Permission 
} from "@/lib/permissions";
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";

export default function Profile() {
  const { user, permissions, refreshPermissions } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [showPermissions, setShowPermissions] = useState(false); // เริ่มต้นด้วยธีมเดิม

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const session = getSession();
      const token = session?.token;
      
      const response = await getUserProfileApi(user.id, token);
      
      if (response.success && response.data) {
        setProfileData(response.data);
        setLastUpdated(new Date().toLocaleString('th-TH'));
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshPermissions = async () => {
    setIsLoading(true);
    try {
      const success = await refreshPermissions();
      if (success) {
        await fetchProfileData();
        alert('✅ รีเฟรชข้อมูลสิทธิ์สำเร็จ!');
      } else {
        alert('❌ ไม่สามารถรีเฟรชข้อมูลสิทธิ์ได้');
      }
    } catch (error) {
      alert('❌ เกิดข้อผิดพลาด: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🔐 กรุณาเข้าสู่ระบบ
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            กรุณาเข้าสู่ระบบเพื่อดูข้อมูลโปรไฟล์
          </p>
        </div>
      </div>
    );
  }

  // Safely convert roles to array
  const userRoles: Role[] = Array.isArray(user.roles) 
    ? (user.roles as Role[]) 
    : typeof user.roles === 'string' 
    ? [user.roles as Role] 
    : [];
    
  // Safely convert permissions to array
  const currentPermissions = Array.isArray(permissions) ? permissions : [];
  const userPermissions: Permission[] = [
    ...(currentPermissions as Permission[]),
    ...getPermissionsFromRoles(userRoles)
  ];
  const uniquePermissions = Array.from(new Set(userPermissions));

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex items-center justify-between mb-5 lg:mb-7">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Profile
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowPermissions(!showPermissions)}
              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-medium transition-colors"
            >
              {showPermissions ? '👤 Profile' : '🔑 Permissions'}
            </button>
            {showPermissions && (
              <button
                onClick={handleRefreshPermissions}
                disabled={isLoading}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {isLoading ? 'Updating...' : '🔄 Refresh'}
              </button>
            )}
          </div>
        </div>

        {showPermissions ? (
          /* Permissions View */
          <div className="space-y-6">
            {/* Current Permissions */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">
                🔑 User Permissions
              </h4>
              <UserPermissions showDetails={true} />
            </div>

            {/* Permissions Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Roles */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
                  🎭 Roles ({userRoles.length})
                </h4>
                <div className="space-y-2">
                  {userRoles.length > 0 ? (
                    userRoles.map(role => (
                      <div key={role} className="p-2 bg-white dark:bg-gray-700 rounded text-sm">
                        <span className={`font-medium ${
                          role === 'admin'
                            ? 'text-red-600 dark:text-red-400'
                            : role === 'manager'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {role === 'admin' ? '👑 ' : role === 'manager' ? '👔 ' : '👤 '}
                          {String(role)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          ({ROLE_PERMISSIONS[role]?.length || 0} permissions)
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No roles assigned
                    </p>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
                  🔐 Permissions ({uniquePermissions.length})
                </h4>
                <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
                  {uniquePermissions.length > 0 ? (
                    uniquePermissions.map(permission => (
                      <div
                        key={permission}
                        className="flex items-center space-x-2 p-1.5 bg-white dark:bg-gray-700 rounded text-xs"
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {String(getPermissionLabel(permission))}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No permissions assigned
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* API Data */}
            {profileData && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="text-md font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
                  📡 API Data
                </h4>
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    View Raw Response
                  </summary>
                  <pre className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(profileData, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        ) : (
          /* Original Profile View */
          <div className="space-y-6">
            <UserMetaCard />
            <UserInfoCard />
            <UserAddressCard />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get Thai labels for permissions
function getPermissionLabel(permission: Permission): string {
  const labels: Record<Permission, string> = {
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
    'ui_elements': 'องค์ประกอบ UI'
  };

  return labels[permission] || permission;
}
