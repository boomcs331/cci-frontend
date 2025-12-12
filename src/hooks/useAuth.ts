'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getSession, 
  getCurrentUser, 
  getUserPermissions, 
  isAuthenticated, 
  login as authLogin, 
  logout as authLogout,
  type User,
  type Session
} from '@/lib/auth';
import { securityLogger, sessionMonitor, createSessionInfo, secureSessionStorage } from '@/lib/sessionSecurity';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const currentUser = getCurrentUser();
        const userPermissions = getUserPermissions();
        
        setUser(currentUser);
        setPermissions(userPermissions);

        // Start session monitoring if user is logged in
        if (currentUser) {
          sessionMonitor.start(() => {
            // Session expired callback
            setUser(null);
            setPermissions([]);
            router.push('/signin');
          });
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setUser(null);
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Cleanup on unmount
    return () => {
      sessionMonitor.stop();
    };
  }, [router]);

  const login = (userData: User, token?: string, userPermissions?: string[]) => {
    try {
      // Create enhanced session info
      const sessionInfo = createSessionInfo(
        userData.id,
        userData.email,
        userPermissions || []
      );

      // Save session with security
      authLogin(userData, token, userPermissions);
      secureSessionStorage.setItem('session_info', sessionInfo);
      
      setUser(userData);
      setPermissions(userPermissions || []);
      
      // Log security event
      securityLogger.logEvent({
        type: 'login',
        userId: userData.id,
        details: {
          email: userData.email,
          timestamp: Date.now(),
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
          sessionId: sessionInfo.sessionId
        }
      });

      // Start session monitoring
      sessionMonitor.start(() => {
        setUser(null);
        setPermissions([]);
        router.push('/signin');
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    try {
      const currentUser = getCurrentUser();
      
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
      
      setUser(null);
      setPermissions([]);
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshSession = () => {
    const session = getSession();
    if (session) {
      setUser(session.user);
      setPermissions(session.permissions || []);
    }
  };

  return {
    user,
    permissions,
    isLoading,
    isAuthenticated: isAuthenticated(),
    login,
    logout,
    refreshSession
  };
}