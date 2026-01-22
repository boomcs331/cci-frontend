// Permission constants

export const PERMISSIONS = {
  // Material permissions
  MATERIAL_READ: 'CAN_READ',
  MATERIAL_CREATE: 'CAN_CREATE',
  MATERIAL_UPDATE: 'CAN_UPDATE',
  MATERIAL_DELETE: 'CAN_DELETE',

  // User permissions
  USER_READ: 'USER_READ',
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',

  // Role permissions
  ROLE_READ: 'ROLE_READ',
  ROLE_CREATE: 'ROLE_CREATE',
  ROLE_UPDATE: 'ROLE_UPDATE',
  ROLE_DELETE: 'ROLE_DELETE',
} as const;

export const ADMIN_ROLE_ID = '1';

// Helper functions
export function hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  return required.some(perm => userPermissions.includes(perm));
}

export function hasAllPermissions(userPermissions: string[], required: string[]): boolean {
  return required.every(perm => userPermissions.includes(perm));
}
