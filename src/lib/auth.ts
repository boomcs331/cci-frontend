// Authentication utilities and session management

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

export interface Session {
  user: User;
  token?: string;
  expiresAt?: number;
  permissions?: string[];
}

// Session storage keys
const SESSION_KEY = 'user_session';
const USER_KEY = 'user';
const PERMISSIONS_KEY = 'permissions';
const TOKEN_KEY = 'auth_token';

/**
 * Get current session from localStorage
 */
export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;

  try {
    const userData = localStorage.getItem(USER_KEY);
    const permissionsData = localStorage.getItem(PERMISSIONS_KEY);
    const token = localStorage.getItem(TOKEN_KEY);

    if (!userData) return null;

    const user = JSON.parse(userData);
    const permissions = permissionsData ? JSON.parse(permissionsData) : [];

    return {
      user,
      token: token || undefined,
      permissions
    };
  } catch (error) {
    console.error('Error parsing session data:', error);
    clearSession();
    return null;
  }
}

/**
 * Save session to localStorage
 */
export function saveSession(session: Session): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    
    if (session.permissions) {
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(session.permissions));
    }
    
    if (session.token) {
      localStorage.setItem(TOKEN_KEY, session.token);
    }
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('user_profile'); // Clear profile data too
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const session = getSession();
  return session !== null && session.user !== null;
}

/**
 * Check if session is expired (if expiration is set)
 */
export function isSessionExpired(): boolean {
  const session = getSession();
  
  if (!session || !session.expiresAt) return false;
  
  return Date.now() > session.expiresAt;
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  const session = getSession();
  return session?.user || null;
}

/**
 * Get user permissions
 */
export function getUserPermissions(): string[] {
  const session = getSession();
  return session?.permissions || [];
}

/**
 * Check if user has specific permission
 */
export function hasPermission(permission: string): boolean {
  const permissions = getUserPermissions();
  return permissions.includes(permission);
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(roles: string | string[]): boolean {
  const user = getCurrentUser();
  if (!user || !user.roles) return false;

  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.some(role => user.roles!.includes(role));
}

/**
 * Login user and save session
 */
export function login(user: User, token?: string, permissions?: string[]): void {
  const session: Session = {
    user,
    token,
    permissions: permissions || [],
    expiresAt: token ? Date.now() + (24 * 60 * 60 * 1000) : undefined // 24 hours if token provided
  };

  saveSession(session);
}

/**
 * Update user permissions from API
 */
export async function updateUserPermissionsFromApi(userId: string, token?: string): Promise<{
  success: boolean;
  permissions?: string[];
  error?: string;
}> {
  try {
    // Import getUserProfileApi dynamically to avoid circular dependency
    const { getUserProfileApi } = await import('./api');
    
    console.log('🔄 Fetching user permissions from API for user:', userId);
    
    const response = await getUserProfileApi(userId, token);
    
    if (response.success && response.data) {
      const permissions = response.data.permissions || [];
      
      // Update current session with new permissions
      const currentSession = getSession();
      if (currentSession) {
        const updatedSession: Session = {
          ...currentSession,
          permissions
        };
        saveSession(updatedSession);
        
        console.log('✅ User permissions updated from API:', permissions);
        return {
          success: true,
          permissions
        };
      }
    }
    
    console.log('❌ Failed to fetch permissions from API:', response.error);
    return {
      success: false,
      error: response.error || 'Failed to fetch permissions'
    };
    
  } catch (error: any) {
    console.error('❌ Error updating permissions from API:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Get stored user profile data
 */
export function getStoredUserProfile(): any | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const profileData = localStorage.getItem('user_profile');
    return profileData ? JSON.parse(profileData) : null;
  } catch (error) {
    console.error('Error parsing stored profile:', error);
    return null;
  }
}

/**
 * Save user profile data
 */
export function saveUserProfile(profileData: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('user_profile', JSON.stringify(profileData));
  } catch (error) {
    console.error('Error saving profile data:', error);
  }
}

/**
 * Update user data in session with profile information
 */
export function updateUserWithProfile(profileData: any): boolean {
  try {
    const currentSession = getSession();
    if (!currentSession) return false;

    // Merge profile data with current user data
    const updatedUser: User = {
      ...currentSession.user,
      ...profileData,
      // Keep essential session data
      id: currentSession.user.id,
      username: currentSession.user.username,
      email: currentSession.user.email
    };

    // Update session with merged data
    const updatedSession: Session = {
      ...currentSession,
      user: updatedUser,
      permissions: profileData.permissions || currentSession.permissions
    };

    saveSession(updatedSession);
    saveUserProfile(profileData);
    
    console.log('✅ User session updated with profile data');
    return true;
  } catch (error) {
    console.error('❌ Error updating user with profile:', error);
    return false;
  }
}

/**
 * Logout user and clear session
 */
export function logout(): void {
  clearSession();
}