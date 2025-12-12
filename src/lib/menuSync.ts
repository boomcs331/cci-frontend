// Menu synchronization with API permissions

import { getUserProfileApi } from './api';
import { getSession } from './auth';
import { type Permission } from './permissions';

export interface MenuSyncResult {
  success: boolean;
  permissions: Permission[];
  error?: string;
}

/**
 * Sync menu permissions with API
 */
export async function syncMenuWithApi(userId: string): Promise<MenuSyncResult> {
  try {
    console.log('🔄 Syncing menu permissions with API for user:', userId);
    
    const session = getSession();
    const token = session?.token;
    
    const response = await getUserProfileApi(userId, token);
    
    if (response.success && response.data) {
      const apiPermissions = response.data.permissions || [];
      
      console.log('✅ Menu permissions synced from API:', apiPermissions);
      
      return {
        success: true,
        permissions: apiPermissions as Permission[]
      };
    } else {
      console.log('❌ Failed to sync menu permissions:', response.error);
      return {
        success: false,
        permissions: [],
        error: response.error || 'Failed to sync permissions'
      };
    }
  } catch (error: any) {
    console.error('❌ Error syncing menu permissions:', error);
    return {
      success: false,
      permissions: [],
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Get menu permissions from API with fallback
 */
export async function getMenuPermissions(userId: string, fallbackPermissions: Permission[] = []): Promise<Permission[]> {
  const result = await syncMenuWithApi(userId);
  
  if (result.success) {
    return result.permissions;
  } else {
    console.warn('⚠️ Using fallback permissions for menu');
    return fallbackPermissions;
  }
}

/**
 * Check if menu should be refreshed based on last sync time
 */
export function shouldRefreshMenu(lastSyncTime?: number): boolean {
  if (!lastSyncTime) return true;
  
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes
  
  return (now - lastSyncTime) > fiveMinutes;
}

/**
 * Store last menu sync time
 */
export function setLastMenuSync(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('last_menu_sync', Date.now().toString());
  }
}

/**
 * Get last menu sync time
 */
export function getLastMenuSync(): number | null {
  if (typeof window !== 'undefined') {
    const lastSync = localStorage.getItem('last_menu_sync');
    return lastSync ? parseInt(lastSync, 10) : null;
  }
  return null;
}

/**
 * Clear menu sync data
 */
export function clearMenuSync(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('last_menu_sync');
  }
}