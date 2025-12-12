'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getSession, 
  getCurrentUser, 
  getUserPermissions, 
  isAuthenticated, 
  login as authLogin, 
  logout as authLogout,
  type User
} from '@/lib/auth';
import { securityLogger, sessionMonitor, createSessionInfo, secureSessionStorage } from '@/lib/sessionSecurity';
import { syncMenuWithApi, setLastMenuSync, shouldRefreshMenu, getLastMenuSync } from '@/lib/menuSync';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = getCurrentUser();
        const userPermissions = getUserPermissions();
        
        setUser(currentUser);
        setPermissions(userPermissions);

        // Start session monitoring if user is logged in
        if (currentUser) {
          sessionMonitor.start(() => {
            // Session expired callback
            console.log('🔒 Session expired, logging out...');
            setUser(null);
            setPermissions([]);
            // Use replace instead of push to avoid history issues
            router.replace('/signin');
          });

          // Check if menu permissions need to be refreshed
          const lastSync = getLastMenuSync();
          if (shouldRefreshMenu(lastSync || undefined)) {
            console.log('🔄 Refreshing menu permissions from API...');
            try {
              const menuSync = await syncMenuWithApi(currentUser.id);
              if (menuSync.success) {
                setPermissions(menuSync.permissions);
                setLastMenuSync();
                console.log('✅ Menu permissions updated from API');
              }
            } catch (error) {
              console.warn('⚠️ Failed to refresh menu permissions, using cached data');
            }
          }
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

  const login = useCallback(async (userData: User, token?: string, userPermissions?: string[]) => {
    try {
      // Create enhanced session info
      const sessionInfo = createSessionInfo(
        userData.id,
        userData.email,
        userPermissions || []
      );

      // Save session with security (initial permissions)
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
        console.log('🔒 Session expired during login, logging out...');
        setUser(null);
        setPermissions([]);
        router.replace('/signin');
      });

      // Fetch complete user profile from API
      try {
        console.log('🔄 Fetching complete user profile from API...');
        const { getUserProfileApi } = await import('@/lib/api');
        const { updateUserPermissionsFromApi } = await import('@/lib/auth');
        
        // Get full profile data
        const profileResult = await getUserProfileApi(userData.id, token);
        
        if (profileResult.success && profileResult.data) {
          console.log('✅ Profile data fetched from API:', profileResult.data);
          
          // Extract permissions from API response structure
          let extractedPermissions: string[] = [];
          
          // Check if permissions are directly in the response
          if (profileResult.data.permissions && Array.isArray(profileResult.data.permissions)) {
            extractedPermissions = profileResult.data.permissions;
          }
          
          // Extract permissions from roles if available
          // Check both nested user roles and direct roles
          const userRoles = (profileResult.data as any).user?.roles || profileResult.data.roles;
          if (userRoles && Array.isArray(userRoles)) {
            const rolePermissions: string[] = [];
            userRoles.forEach((role: any) => {
              if (role.permissions && Array.isArray(role.permissions)) {
                const perms = role.permissions.map((perm: any) => perm.code || perm);
                rolePermissions.push(...perms);
              }
            });
            extractedPermissions.push(...rolePermissions);
          }
          
          // Remove duplicates
          extractedPermissions = Array.from(new Set(extractedPermissions));
          
          // Update user data with profile information
          const apiUser = (profileResult.data as any).user || profileResult.data;
          const updatedUser = {
            ...userData,
            ...apiUser, // Use user object from API response
            // Keep original login data but merge with profile
            id: userData.id,
            username: userData.username,
            email: userData.email,
            // Add roles from API if available
            roles: apiUser?.roles || profileResult.data.roles || userData.roles
          };
          
          // Use extracted permissions or fallback to provided permissions
          const finalPermissions = extractedPermissions.length > 0 ? extractedPermissions : (userPermissions || []);
          
          // Update session with complete profile data
          authLogin(updatedUser, token, finalPermissions);
          setUser(updatedUser);
          setPermissions(finalPermissions);
          
          // Update session info with complete data
          const updatedSessionInfo = createSessionInfo(
            updatedUser.id,
            updatedUser.email,
            finalPermissions
          );
          secureSessionStorage.setItem('session_info', updatedSessionInfo);
          
          // Store complete profile data separately for easy access
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_profile', JSON.stringify({
              ...profileResult.data,
              // Ensure we store the complete structure for later access
              user: apiUser
            }));
          }
          
          console.log('✅ Complete profile and permissions updated from API');
          console.log('🔍 Final user roles:', updatedUser.roles);
          console.log('🔍 Final permissions:', finalPermissions);
        } else {
          console.log('⚠️ Could not fetch profile from API, using login data only');
          
          // Fallback: try to get permissions only
          const permissionResult = await updateUserPermissionsFromApi(userData.id, token);
          if (permissionResult.success && permissionResult.permissions) {
            setPermissions(permissionResult.permissions);
            
            const updatedSessionInfo = createSessionInfo(
              userData.id,
              userData.email,
              permissionResult.permissions
            );
            secureSessionStorage.setItem('session_info', updatedSessionInfo);
          }
        }
      } catch (apiError) {
        console.warn('⚠️ API profile fetch failed, continuing with login data:', apiError);
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, [router]);

  const logout = useCallback((redirect: boolean = true) => {
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
      
      // Only redirect if requested
      if (redirect) {
        router.push('/signin');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);

  const refreshSession = () => {
    const session = getSession();
    if (session) {
      setUser(session.user);
      setPermissions(session.permissions || []);
    }
  };

  const refreshPermissions = useCallback(async () => {
    if (!user) return false;

    try {
      console.log('🔄 Refreshing user permissions from API...');
      const { updateUserPermissionsFromApi } = await import('@/lib/auth');
      const session = getSession();
      const token = session?.token;
      
      const result = await updateUserPermissionsFromApi(user.id, token);
      
      if (result.success && result.permissions) {
        setPermissions(result.permissions);
        console.log('✅ Permissions refreshed successfully:', result.permissions);
        return true;
      } else {
        console.log('❌ Failed to refresh permissions:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error refreshing permissions:', error);
      return false;
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return false;

    try {
      console.log('🔄 Refreshing complete user profile from API...');
      const { getUserProfileApi } = await import('@/lib/api');
      const session = getSession();
      const token = session?.token;
      
      const profileResult = await getUserProfileApi(user.id, token);
      
      if (profileResult.success && profileResult.data) {
        // Update user data with fresh profile
        const updatedUser = {
          ...user,
          ...profileResult.data,
          // Keep session identifiers
          id: user.id,
          username: user.username,
          email: user.email
        };
        
        // Update permissions from profile
        const profilePermissions = profileResult.data.permissions || permissions;
        
        // Update session
        const { login: authLogin } = await import('@/lib/auth');
        authLogin(updatedUser, token, profilePermissions);
        setUser(updatedUser);
        setPermissions(profilePermissions);
        
        // Store profile data
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_profile', JSON.stringify(profileResult.data));
        }
        
        console.log('✅ Complete profile refreshed successfully');
        return true;
      } else {
        console.log('❌ Failed to refresh profile:', profileResult.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error refreshing profile:', error);
      return false;
    }
  }, [user, permissions]);

  const getStoredProfile = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const profileData = localStorage.getItem('user_profile');
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Error parsing stored profile:', error);
      return null;
    }
  }, []);

  return {
    user,
    permissions,
    isLoading,
    isAuthenticated: isAuthenticated(),
    login,
    logout,
    refreshSession,
    refreshPermissions,
    refreshProfile,
    getStoredProfile
  };
}