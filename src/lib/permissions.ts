// Permission and role management system

export type Permission = 
  | 'read' 
  | 'write' 
  | 'delete' 
  | 'admin' 
  | 'user_management' 
  | 'system_settings'
  | 'reports'
  | 'analytics'
  | 'calendar'
  | 'forms'
  | 'tables'
  | 'charts'
  | 'ui_elements';

export type Role = 'admin' | 'user' | 'manager' | 'viewer' | 'ADMIN' | 'USER' | 'MANAGER' | 'VIEWER';

// API Role structure from real API response
export interface ApiRole {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: ApiPermission[];
}

// API Permission structure from real API response
export interface ApiPermission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
  createdAt: string;
  updatedAt: string;
}

// API User structure from real API response
export interface ApiUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  roles: ApiRole[];
}

export interface MenuPermission {
  roles?: Role[];
  permissions?: Permission[];
  requireAll?: boolean; // true = ต้องมีทุก permission, false = มีอย่างน้อย 1 permission
}

// Define menu permissions - ใช้ข้อมูลจาก API เป็นหลัก
export const MENU_PERMISSIONS: Record<string, MenuPermission> = {
  // Dashboard - ทุกคนเข้าได้
  'dashboard': {
    permissions: ['read']
  },
  
  // Calendar - ตรวจสอบจาก API
  'calendar': {
    permissions: ['calendar']
  },
  
  // User Profile - ทุกคนเข้าได้
  'profile': {
    permissions: ['read']
  },
  
  // Forms - ตรวจสอบจาก API
  'forms': {
    permissions: ['forms']
  },
  'form-elements': {
    permissions: ['forms']
  },
  
  // Tables - ตรวจสอบจาก API
  'tables': {
    permissions: ['tables']
  },
  'basic-tables': {
    permissions: ['tables']
  },
  
  // Charts - ตรวจสอบจาก API
  'charts': {
    permissions: ['charts']
  },
  'line-chart': {
    permissions: ['charts']
  },
  'bar-chart': {
    permissions: ['charts']
  },
  
  // UI Elements - ทุกคนเข้าได้
  'ui-elements': {
    permissions: ['ui_elements']
  },
  'alerts': {
    permissions: ['ui_elements']
  },
  'avatars': {
    permissions: ['ui_elements']
  },
  'badge': {
    permissions: ['ui_elements']
  },
  'buttons': {
    permissions: ['ui_elements']
  },
  'images': {
    permissions: ['ui_elements']
  },
  'videos': {
    permissions: ['ui_elements']
  },
  
  // Authentication pages - ทุกคนเข้าได้
  'signin': {
    permissions: ['read']
  },
  'signup': {
    permissions: ['read']
  },
  
  // Material - ทุกคนเข้าได้
  'material': {
    permissions: ['read']
  },
  'add-material': {
    permissions: ['read']
  },
  'view-material': {
    permissions: ['read']
  },
  
  // Production - ทุกคนเข้าได้
  'production': {
    permissions: ['read']
  },
  'material-management': {
    permissions: ['read']
  },
  'edit-material': {
    permissions: ['read']
  },
  'quality-control': {
    permissions: ['read']
  },
  'inspection-reports': {
    permissions: ['read']
  },
  'quality-metrics': {
    permissions: ['read']
  },
  'defect-tracking': {
    permissions: ['read']
  },
  'production-planning': {
    permissions: ['read']
  },
  'schedule-management': {
    permissions: ['read']
  },
  'resource-allocation': {
    permissions: ['read']
  },
  'capacity-planning': {
    permissions: ['read']
  },
  
  // Pages - ทุกคนเข้าได้
  'blank': {
    permissions: ['read']
  },
  'error-404': {
    permissions: ['read']
  },
  
  // Admin only sections - ตรวจสอบจาก API
  'user-management': {
    permissions: ['user_management']
  },
  'system-settings': {
    permissions: ['system_settings']
  },
  'security-logs': {
    permissions: ['admin']
  },
  'reports': {
    permissions: ['reports']
  },
  'analytics': {
    permissions: ['analytics']
  }
};

// Role-based default permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'read', 'write', 'delete', 'admin', 
    'user_management', 'system_settings', 
    'reports', 'analytics', 'calendar', 
    'forms', 'tables', 'charts', 'ui_elements'
  ],
  ADMIN: [
    'read', 'write', 'delete', 'admin', 
    'user_management', 'system_settings', 
    'reports', 'analytics', 'calendar', 
    'forms', 'tables', 'charts', 'ui_elements'
  ],
  manager: [
    'read', 'write', 'reports', 'analytics', 
    'calendar', 'forms', 'tables', 'charts', 'ui_elements'
  ],
  MANAGER: [
    'read', 'write', 'reports', 'analytics', 
    'calendar', 'forms', 'tables', 'charts', 'ui_elements'
  ],
  user: [
    'read', 'write', 'calendar', 'forms', 'tables', 'ui_elements'
  ],
  USER: [
    'read', 'write', 'calendar', 'forms', 'tables', 'ui_elements'
  ],
  viewer: [
    'read', 'ui_elements'
  ],
  VIEWER: [
    'read', 'ui_elements'
  ]
};

/**
 * Extract role codes from API roles structure
 */
export function extractRoleCodes(apiRoles: ApiRole[] | string[] | string): string[] {
  if (!apiRoles) return [];
  
  // Handle string array (simple roles)
  if (Array.isArray(apiRoles) && apiRoles.length > 0 && typeof apiRoles[0] === 'string') {
    return apiRoles as string[];
  }
  
  // Handle single string role
  if (typeof apiRoles === 'string') {
    return [apiRoles];
  }
  
  // Handle API role objects
  if (Array.isArray(apiRoles) && apiRoles.length > 0 && typeof apiRoles[0] === 'object') {
    return (apiRoles as ApiRole[]).map(role => role.code);
  }
  
  return [];
}

/**
 * Extract permission codes from API permissions structure
 */
export function extractPermissionCodes(apiPermissions: ApiPermission[] | string[]): string[] {
  if (!apiPermissions) return [];
  
  // Handle string array (simple permissions)
  if (Array.isArray(apiPermissions) && apiPermissions.length > 0 && typeof apiPermissions[0] === 'string') {
    return apiPermissions as string[];
  }
  
  // Handle API permission objects
  if (Array.isArray(apiPermissions) && apiPermissions.length > 0 && typeof apiPermissions[0] === 'object') {
    return (apiPermissions as ApiPermission[]).map(permission => permission.code);
  }
  
  return [];
}

/**
 * Extract all permissions from API roles (nested permissions)
 */
export function extractPermissionsFromApiRoles(apiRoles: ApiRole[]): string[] {
  if (!Array.isArray(apiRoles)) return [];
  
  const allPermissions: string[] = [];
  
  apiRoles.forEach(role => {
    if (role.permissions && Array.isArray(role.permissions)) {
      const rolePermissions = extractPermissionCodes(role.permissions);
      allPermissions.push(...rolePermissions);
    }
  });
  
  // Remove duplicates
  return Array.from(new Set(allPermissions));
}

/**
 * Check if user is admin based on API data structure
 */
export function isAdminFromApiData(apiRoles: ApiRole[] | string[], apiPermissions?: string[]): boolean {
  const roleCodes = extractRoleCodes(apiRoles);
  
  // Check for admin role codes
  const hasAdminRole = roleCodes.some(code => 
    code.toUpperCase() === 'ADMIN' || 
    code.toLowerCase() === 'admin'
  );
  
  if (hasAdminRole) {
    return true;
  }
  
  // Check for admin permissions
  if (apiPermissions) {
    const hasAdminPermission = apiPermissions.some(permission => 
      permission.toLowerCase().includes('admin') ||
      permission.toUpperCase().includes('ADMIN')
    );
    return hasAdminPermission;
  }
  
  return false;
}

/**
 * Check if user has permission to access a menu item (ใช้ข้อมูลจาก API)
 */
export function hasMenuPermission(
  menuKey: string,
  userRoles: Role[] | string[],
  userPermissions: Permission[] | string[]
): boolean {
  // Convert to string arrays for consistency
  const roleStrings = Array.isArray(userRoles) ? userRoles.map(String) : [];
  const permissionStrings = Array.isArray(userPermissions) ? userPermissions.map(String) : [];
  
  // ADMIN role has access to everything - bypass all permission checks
  const isAdmin = roleStrings.some(role => 
    role.toUpperCase() === 'ADMIN' || role.toLowerCase() === 'admin'
  ) || permissionStrings.some(permission => 
    permission.toLowerCase().includes('admin')
  );
  
  if (isAdmin) {
    console.log(`🔓 Admin access granted for menu: ${menuKey}`);
    return true;
  }

  const menuPermission = MENU_PERMISSIONS[menuKey];
  
  // If no permission defined, allow access for basic items
  if (!menuPermission) {
    return true;
  }
  
  // Check role-based access (ถ้ามีการกำหนด roles)
  if (menuPermission.roles && menuPermission.roles.length > 0) {
    const hasRequiredRole = menuPermission.roles.some(role => 
      roleStrings.includes(role) || roleStrings.includes(role.toUpperCase())
    );
    if (!hasRequiredRole) {
      return false;
    }
  }
  
  // Check permission-based access (ใช้ข้อมูลจาก API เป็นหลัก)
  if (menuPermission.permissions && menuPermission.permissions.length > 0) {
    if (menuPermission.requireAll) {
      // ต้องมีทุก permission
      return menuPermission.permissions.every(permission => 
        permissionStrings.includes(permission)
      );
    } else {
      // มีอย่างน้อย 1 permission (default behavior)
      return menuPermission.permissions.some(permission => 
        permissionStrings.includes(permission)
      );
    }
  }
  
  return true;
}

/**
 * Check if user has permission based on API response (ใหม่)
 */
export function hasApiPermission(
  requiredPermission: Permission,
  apiPermissions: string[]
): boolean {
  // ตรวจสอบว่ามี permission ที่ต้องการใน API response หรือไม่
  return apiPermissions.includes(requiredPermission);
}

/**
 * Filter menu items based on API permissions (ใหม่)
 */
export function filterMenuByApiPermissions(
  menuItems: any[],
  apiPermissions: string[],
  userRoles: Role[] = []
): any[] {
  // ADMIN role has access to everything
  if (userRoles.includes('admin')) {
    return menuItems;
  }

  return menuItems.filter(item => {
    const menuKey = item.menuKey || getMenuKeyFromPath(item.path || '');
    const menuPermission = MENU_PERMISSIONS[menuKey];
    
    // ถ้าไม่มีการกำหนด permission ให้แสดง
    if (!menuPermission || !menuPermission.permissions) {
      return true;
    }
    
    // ตรวจสอบ permission จาก API
    return menuPermission.permissions.some(permission => 
      apiPermissions.includes(permission)
    );
  });
}

/**
 * Get permissions from roles
 */
export function getPermissionsFromRoles(roles: Role[]): Permission[] {
  const permissions = new Set<Permission>();
  
  roles.forEach(role => {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    rolePermissions.forEach(permission => permissions.add(permission));
  });
  
  return Array.from(permissions);
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  permission: Permission,
  userPermissions: Permission[]
): boolean {
  return userPermissions.includes(permission);
}

/**
 * Check if user has specific role
 */
export function hasRole(
  role: Role,
  userRoles: Role[]
): boolean {
  return userRoles.includes(role);
}

/**
 * Check if user is admin (has full access)
 */
export function isAdmin(userRoles: Role[]): boolean {
  return userRoles.includes('admin');
}

/**
 * Check if user has admin privileges (bypass all permission checks)
 */
export function hasAdminAccess(userRoles: Role[]): boolean {
  return isAdmin(userRoles);
}

/**
 * Get menu key from path
 */
export function getMenuKeyFromPath(path: string): string {
  // Remove leading slash and convert to menu key
  const cleanPath = path.replace(/^\//, '');
  
  // Handle special cases
  const pathMappings: Record<string, string> = {
    '': 'dashboard',
    'dashboard': 'dashboard',
    'calendar': 'calendar',
    'profile': 'profile',
    'form-elements': 'form-elements',
    'basic-tables': 'basic-tables',
    'line-chart': 'line-chart',
    'bar-chart': 'bar-chart',
    'alerts': 'alerts',
    'avatars': 'avatars',
    'badge': 'badge',
    'buttons': 'buttons',
    'images': 'images',
    'videos': 'videos',
    'signin': 'signin',
    'signup': 'signup',
    'blank': 'blank',
    'add-material': 'add-material',
    'view-material': 'view-material',
    'edit-material': 'edit-material',
    'inspection-reports': 'inspection-reports',
    'quality-metrics': 'quality-metrics',
    'defect-tracking': 'defect-tracking',
    'schedule-management': 'schedule-management',
    'resource-allocation': 'resource-allocation',
    'capacity-planning': 'capacity-planning',
    'error-404': 'error-404',
    'security-logs': 'security-logs'
  };
  
  return pathMappings[cleanPath] || cleanPath;
}