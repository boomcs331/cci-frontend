'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, isSessionExpired, clearSession } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
}

export default function AuthGuard({
  children,
  redirectTo = '/signin',
  requireAuth = true,
  allowedRoles = [],
  fallback
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      console.log('🔍 AuthGuard: Checking authentication for path:', pathname);

      // Skip auth check for public routes
      const publicRoutes = ['/signin', '/signup'];
      const isPublicRoute = publicRoutes.includes(pathname);
      
      if (isPublicRoute) {
        console.log('✅ AuthGuard: Public route detected, allowing access');
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      // Check if authentication is required
      if (!requireAuth) {
        console.log('✅ AuthGuard: Auth not required, allowing access');
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      // Check if user is authenticated
      const authenticated = isAuthenticated();
      console.log('🔐 AuthGuard: User authenticated?', authenticated);

      if (!authenticated) {
        console.log('❌ AuthGuard: User not authenticated, redirecting to', redirectTo);
        router.push(redirectTo);
        return;
      }

      // Check if session is expired
      const expired = isSessionExpired();
      console.log('⏰ AuthGuard: Session expired?', expired);

      if (expired) {
        console.log('❌ AuthGuard: Session expired, clearing session and redirecting');
        clearSession();
        router.push(redirectTo);
        return;
      }

      console.log('✅ AuthGuard: All checks passed, allowing access');
      setIsAuthorized(true);
      setIsLoading(false);
    };

    // Run check immediately
    checkAuth();

    // Also run check when pathname changes
  }, [pathname, router, redirectTo, requireAuth, allowedRoles]);

  // Show loading state
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
          </div>
        </div>
      )
    );
  }

  // Show children if authorized
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}