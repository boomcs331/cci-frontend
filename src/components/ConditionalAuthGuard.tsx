'use client';

import { usePathname } from 'next/navigation';
import AuthGuard from './AuthGuard';

interface ConditionalAuthGuardProps {
  children: React.ReactNode;
}

export default function ConditionalAuthGuard({ children }: ConditionalAuthGuardProps) {
  const pathname = usePathname();
  
  console.log('🛡️ ConditionalAuthGuard: Current path:', pathname);
  
  // Routes that don't need authentication
  const publicRoutes = ['/signin', '/signup', '/error-404', '/logout'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  console.log('🔓 ConditionalAuthGuard: Is public route?', isPublicRoute);
  
  // If it's a public route, don't apply AuthGuard
  if (isPublicRoute) {
    console.log('✅ ConditionalAuthGuard: Public route, no auth required');
    return <>{children}</>;
  }
  
  // For all other routes, apply AuthGuard
  console.log('🔒 ConditionalAuthGuard: Protected route, applying AuthGuard');
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}