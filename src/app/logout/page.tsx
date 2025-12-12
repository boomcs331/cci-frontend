'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout as authLogout } from '@/lib/auth';
import { securityLogger, sessionMonitor, secureSessionStorage } from '@/lib/sessionSecurity';

export default function LogoutPage() {
  const router = useRouter();
  const [hasLoggedOut, setHasLoggedOut] = useState(false);

  useEffect(() => {
    if (hasLoggedOut) return; // ป้องกันการเรียกซ้ำ

    const performLogout = async () => {
      console.log('🚪 Logout: Starting logout process...');
      
      try {
        // Get current user before logout
        const currentUser = typeof window !== 'undefined' ? 
          JSON.parse(localStorage.getItem('user') || 'null') : null;
        
        if (currentUser) {
          // Log security event
          securityLogger.logEvent({
            type: 'logout',
            userId: currentUser.id,
            details: {
              timestamp: Date.now(),
              manual: true
            }
          });
        }

        // Stop session monitoring
        sessionMonitor.stop();

        // Clear all session data
        authLogout();
        secureSessionStorage.removeItem('session_info');
        
        console.log('✅ Logout: Successfully logged out');
        setHasLoggedOut(true);
        
        // Small delay to show the logout message
        setTimeout(() => {
          console.log('🔄 Logout: Redirecting to signin...');
          router.replace('/signin');
        }, 1500);
        
      } catch (error) {
        console.error('❌ Logout: Error during logout:', error);
        setHasLoggedOut(true);
        // Even if there's an error, redirect to signin
        router.replace('/signin');
      }
    };

    performLogout();
  }, [router, hasLoggedOut]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="mb-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            กำลังออกจากระบบ
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            กรุณารอสักครู่...
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            🚪 กำลังดำเนินการ
          </h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left">
            <li>✅ ล้างข้อมูล Session</li>
            <li>✅ ล้างข้อมูลการเข้าสู่ระบบ</li>
            <li>✅ บันทึก Security Log</li>
            <li>✅ เปลี่ยนหน้าไป Login</li>
          </ul>
          
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
            <p className="text-sm text-green-600 dark:text-green-400">
              ✅ ออกจากระบบสำเร็จ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}