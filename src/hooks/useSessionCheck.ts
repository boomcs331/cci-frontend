"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession, getUserDepartmentCode, getUserPermissions, isAdmin, isSessionValid, setSession } from '@/utils/session';
import { canAccessPolicy, getRouteAccessPolicy } from '@/utils/accessControl';
import { getApiUrl } from '@/utils/api';
import type { MenuItem } from '@/types/user';

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

    const session = getSession();
    if (!session || !isSessionValid()) {
      router.replace('/signin');
      return;
    }

    const routePolicy = getRouteAccessPolicy(pathname);
    if (routePolicy) {
      const isAllowed = canAccessPolicy(routePolicy, {
        isAdmin: isAdmin(),
        permissions: getUserPermissions(),
        departmentCode: getUserDepartmentCode(),
      });

      if (!isAllowed) {
        router.replace('/');
        return;
      }
    }

    if ((!session.menus || session.menus.length === 0) && session.user?.id) {
      const departmentId = session.user.departmentId ?? session.user.department?.id;
      const headers: HeadersInit = {
        'x-user-id': session.user.id,
      };
      if (departmentId) {
        headers['x-department-id'] = departmentId;
      }

      void fetch(getApiUrl('/auth/menu'), { headers })
        .then(async (response) => {
          if (!response.ok) {
            return;
          }
          const data = (await response.json()) as { menus?: MenuItem[] };
          if (Array.isArray(data.menus) && data.menus.length > 0) {
            setSession({
              ...session,
              menus: data.menus,
            });
          }
        })
        .catch(() => undefined);
    }

    // ตั้ง interval เพื่อตรวจสอบ session ทุก 10 วินาที
    const interval = setInterval(() => {
      if (!isSessionValid()) {
        router.replace('/signin');
      }
    }, 10000); // ตรวจสอบทุก 10 วินาที

    return () => clearInterval(interval);
  }, [router, pathname]);
}
