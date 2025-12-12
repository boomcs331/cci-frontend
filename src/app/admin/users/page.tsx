"use client";
import { useAuth } from "@/hooks/useAuth";
import UserPermissions from "@/components/auth/UserPermissions";

export default function UsersPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          👥 User Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          จัดการผู้ใช้และสิทธิ์การเข้าถึง (Admin Only)
        </p>
      </div>

      {/* Current User Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ข้อมูลผู้ใช้ปัจจุบัน
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
              ข้อมูลส่วนตัว
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">ID:</span> {user?.id}</p>
              <p><span className="font-medium">Username:</span> {user?.username}</p>
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              <p><span className="font-medium">ชื่อ:</span> {user?.firstName} {user?.lastName}</p>
            </div>
          </div>
          <div>
            <UserPermissions showDetails={true} />
          </div>
        </div>
      </div>

      {/* Admin Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-xl">👥</span>
            </div>
            <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
              All Users
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            ดูและจัดการผู้ใช้ทั้งหมดในระบบ
          </p>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
            จัดการผู้ใช้
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-xl">🔑</span>
            </div>
            <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
              Roles & Permissions
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            กำหนดบทบาทและสิทธิ์การใช้งาน
          </p>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
            จัดการสิทธิ์
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 text-xl">🛡️</span>
            </div>
            <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
              Security
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            ตรวจสอบความปลอดภัยและ audit logs
          </p>
          <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
            ดู Security Logs
          </button>
        </div>
      </div>

      {/* Permission Test */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
          🧪 ทดสอบระบบสิทธิ์
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-4">
          หน้านี้จะแสดงเฉพาะผู้ใช้ที่มี role "admin" และ permission "user_management" เท่านั้น
        </p>
        <div className="text-sm text-yellow-600 dark:text-yellow-400">
          ✅ คุณสามารถเข้าถึงหน้านี้ได้ แสดงว่าระบบสิทธิ์ทำงานถูกต้อง!
        </div>
      </div>
    </div>
  );
}