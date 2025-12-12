'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      console.log('🏠 HomePage: Starting authentication check...');
      
      try {
        // Check if user is authenticated
        const authenticated = isAuthenticated();
        console.log('🔐 HomePage: User authenticated?', authenticated);

        if (authenticated) {
          const user = getCurrentUser();
          console.log('👤 HomePage: Current user:', user?.email);
          
          // User is logged in, redirect to dashboard
          console.log('✅ HomePage: Redirecting to dashboard...');
          router.push('/dashboard');
        } else {
          // User is not logged in, redirect to signin
          console.log('❌ HomePage: No session found, redirecting to signin...');
          router.push('/signin');
        }
      } catch (error) {
        console.error('❌ HomePage: Error during auth check:', error);
        // On error, redirect to signin
        router.push('/signin');
      } finally {
        setIsChecking(false);
      }
    };

    // Small delay to ensure proper hydration
    const timer = setTimeout(checkAuthAndRedirect, 100);
    
    return () => clearTimeout(timer);
  }, [router]);

  // Show loading while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="mb-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            กำลังตรวจสอบการเข้าสู่ระบบ
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isChecking ? 'กรุณารอสักครู่...' : 'กำลังเปลี่ยนหน้า...'}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            🔐 ระบบตรวจสอบอัตโนมัติ
          </h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left">
            <li>✅ ตรวจสอบ Session ที่เก็บไว้</li>
            <li>✅ ตรวจสอบการหมดอายุ</li>
            <li>✅ เปลี่ยนหน้าอัตโนมัติ</li>
            <li>✅ ป้องกันการเข้าถึงที่ไม่ได้รับอนุญาต</li>
          </ul>
        </div>
      </div>
    </div>
  );
}