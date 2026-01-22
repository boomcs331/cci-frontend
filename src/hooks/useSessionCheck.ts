"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isSessionValid } from '@/utils/session';

/**
 * Hook สำหรับตรวจสอบ session อัตโนมัติ
 * ใช้ในหน้าที่ต้องการ authentication
 */
export function useSessionCheck() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // ข้ามการตรวจสอบสำหรับหน้า public
    const publicPaths = ['/signin', '/signup', '/reset-password'];
    if (publicPaths.includes(pathname)) {
      return;
    }

    // ตรวจสอบ session
    if (!isSessionValid()) {
      router.push('/signin');
    }

    // ตั้ง interval เพื่อตรวจสอบ session ทุก 10 วินาที
    const interval = setInterval(() => {
      if (!isSessionValid()) {
        router.push('/signin');
      }
    }, 10000); // ตรวจสอบทุก 10 วินาที

    return () => clearInterval(interval);
  }, [router, pathname]);
}
