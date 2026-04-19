// User and Authentication related types

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  roles?: Role[];
  departmentId?: string | null;
  department?: Department | null;
}

export interface Role {
  id: string;
  code?: string;
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface Department {
  id: string;
  code?: string;
  name?: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  message?: string;
  user: User;
  permissions?: string[];
  menus?: MenuItem[];
}

export interface MenuItem {
  id: string;
  code: string;
  label: string;
  path?: string | null;
  iconKey?: string | null;
  sortOrder: number;
  isCollapsible: boolean;
  children: MenuItem[];
}

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
