"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import EditUserModal from "@/components/users/EditUserModal";
import Alert from "@/components/ui/alert/Alert";
import Link from "next/link";
import React, { useEffect, useState } from "react";

type User = {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    isSystem: boolean;
  }>;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    roleIds: [] as string[]
  });
  const [editLoading, setEditLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    isSystem: boolean;
  }>>([]);
  const [roles, setRoles] = useState([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [alert, setAlert] = useState<{variant: 'success' | 'error' | 'warning' | 'info', title: string, message: string} | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const itemsPerPage = 5;

  // Auto hide alert after 3 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('=== FETCH USERS API CALL ===');
        console.log('API URL:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users`);
        console.log('Environment variable NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users`);
        console.log('Fetch users response status:', response.status);
        console.log('Fetch users response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const data = await response.json();
          console.log('Fetch users API response data:', data);
          console.log('Response data type:', typeof data);
          console.log('Is array?', Array.isArray(data));
          
          // Handle different response formats
          let usersArray = [];
          if (Array.isArray(data)) {
            usersArray = data;
          } else if (data.users && Array.isArray(data.users)) {
            usersArray = data.users;
          } else if (data.data && Array.isArray(data.data)) {
            usersArray = data.data;
          }
          
          console.log('Final users array:', usersArray);
          console.log('Users array length:', usersArray.length);
          setUsers(usersArray);
          setTotalPages(Math.ceil(usersArray.length / itemsPerPage));
        } else {
          console.log('Fetch users response not ok:', response.statusText);
          const errorText = await response.text();
          console.log('Fetch users error response body:', errorText);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        console.error('Error details:', error.message);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchRoles = async () => {
      try {
        console.log('=== FETCH ROLES API CALL ===');
        console.log('API URL:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/roles`);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/roles`);
        console.log('Fetch roles response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Fetch roles API response data:', data);
          const rolesArray = Array.isArray(data) ? data : data.roles || data.data || [];
          console.log('Roles array:', rolesArray);
          setAvailableRoles(rolesArray);
        } else {
          console.log('Fetch roles response not ok:', response.statusText);
          const errorText = await response.text();
          console.log('Fetch roles error response body:', errorText);
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    };

    fetchUsers();
    fetchRoles();
  }, []);

  // Sort all users first
  const sortedAllUsers = [...users].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: any = a[sortField as keyof User];
    let bValue: any = b[sortField as keyof User];
    
    if (sortField === 'name') {
      aValue = `${a.firstName || ''} ${a.lastName || ''}`;
      bValue = `${b.firstName || ''} ${b.lastName || ''}`;
    }
    
    if (sortField === 'role') {
      aValue = a.roles.length > 0 ? a.roles[0].name : '';
      bValue = b.roles.length > 0 ? b.roles[0].name : '';
    }
    
    // Special handling for updatedAt - use createdAt if updatedAt is null/empty
    if (sortField === 'updatedAt') {
      aValue = a.updatedAt || a.createdAt;
      bValue = b.updatedAt || b.createdAt;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Then filter the sorted users
  const filteredUsers = sortedAllUsers.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    const matchesRole = roleFilter === 'all' || 
                       (user.roles.length > 0 && user.roles[0].id === roleFilter);
    
    return matchesSearch && matchesStatus && matchesRole;
  });
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  
  // Update total pages based on filtered results
  const filteredTotalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  useEffect(() => {
    if (showEditModal) {
      document.body.style.overflow = 'hidden';
      // ซ่อน header
      const header = document.querySelector('header');
      if (header) {
        header.style.display = 'none';
      }
    } else {
      document.body.style.overflow = 'unset';
      // แสดง header
      const header = document.querySelector('header');
      if (header) {
        header.style.display = 'block';
      }
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      const header = document.querySelector('header');
      if (header) {
        header.style.display = 'block';
      }
    };
  }, [showEditModal]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRoleFilter('all');
    setSortField('');
    setSortDirection('asc');
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      console.log('=== TOGGLE STATUS API CALL ===');
      console.log('User ID:', userId);
      console.log('API URL:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users/${userId}/toggle-status`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users/${userId}/toggle-status`, {
        method: 'PATCH',
      });
      
      console.log('Toggle status response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Toggle status API response data:', data);
        // Update user status in local state
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, isActive: !user.isActive }
            : user
        ));
        // Close modal if open
        if (showEditModal) {
          setShowEditModal(false);
          setEditingUser(null);
        }
        setAlert({variant: 'success', title: 'สำเร็จ', message: data.message || 'เปลี่ยนสถานะผู้ใช้งานเรียบร้อยแล้ว'});
      } else {
        const data = await response.json();
        console.log('Toggle status response not ok:', response.statusText);
        console.log('Toggle status error response body:', data);
        // Close modal if open
        if (showEditModal) {
          setShowEditModal(false);
          setEditingUser(null);
        }
        setAlert({variant: 'error', title: 'เกิดข้อผิดพลาด', message: data.message || 'ไม่สามารถเปลี่ยนสถานะผู้ใช้งานได้'});
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      // Close modal if open
      if (showEditModal) {
        setShowEditModal(false);
        setEditingUser(null);
      }
      setAlert({variant: 'error', title: 'เกิดข้อผิดพลาด', message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'});
    }
  };

  const handleEditUser = async (user: User) => {
    console.log('=== EDIT USER API CALL ===');
    console.log('User ID:', user.id);
    console.log('API URL:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users/${user.id}`);
    
    setEditingUser(user);
    setShowEditModal(true);
    setEditLoading(true);
    
    try {
      // ดึงข้อมูล roles
      const rolesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/roles`);
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users/${user.id}`);
      console.log('Edit user response status:', response.status);
      console.log('Edit user response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Edit user API response data:', data);
        const userData = data.user || data;
        console.log('Processed user data:', userData);
        const newFormData = {
          username: userData.username || '',
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          roleIds: userData.roles?.map((role: any) => role.id) || []
        };
        console.log('Setting form data:', newFormData);
        setEditFormData(newFormData);
      } else {
        console.log('Edit user response not ok:', response.statusText);
        const errorText = await response.text();
        console.log('Edit user error response body:', errorText);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      // Fallback to existing data
      setEditFormData({
        username: user.username,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        roleIds: user.roles?.map((role: any) => role.id) || []
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleStatusInModal = async () => {
    if (!editingUser) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users/${editingUser.id}/toggle-status`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update user status in local state
        setUsers(users.map(user => 
          user.id === editingUser.id 
            ? { ...user, isActive: !user.isActive }
            : user
        ));
        // Close modal and show alert
        setShowEditModal(false);
        setEditingUser(null);
        setAlert({variant: 'success', title: 'สำเร็จ', message: data.message || 'เปลี่ยนสถานะผู้ใช้งานเรียบร้อยแล้ว'});
      } else {
        const data = await response.json();
        // Close modal and show alert
        setShowEditModal(false);
        setEditingUser(null);
        setAlert({variant: 'error', title: 'เกิดข้อผิดพลาด', message: data.message || 'ไม่สามารถเปลี่ยนสถานะผู้ใช้งานได้'});
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      // Close modal and show alert
      setShowEditModal(false);
      setEditingUser(null);
      setAlert({variant: 'error', title: 'เกิดข้อผิดพลาด', message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'});
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Check if response has content before parsing JSON
        let data = {};
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        }
        setUsers(users.filter(user => user.id !== deletingUser.id));
        setAlert({variant: 'success', title: 'สำเร็จ', message: data.message || 'ลบผู้ใช้งานเรียบร้อยแล้ว'});
      } else {
        let data = {};
        try {
          data = await response.json();
        } catch (jsonError) {
          console.log('No JSON response body');
        }
        setAlert({variant: 'error', title: 'เกิดข้อผิดพลาด', message: data.message || 'ไม่สามารถลบผู้ใช้งานได้'});
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      setAlert({variant: 'error', title: 'เกิดข้อผิดพลาด', message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'});
    } finally {
      setShowDeleteModal(false);
      setDeletingUser(null);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    console.log('=== UPDATE USER API CALL ===');
    console.log('User ID:', editingUser.id);
    console.log('API URL:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users/${editingUser.id}`);
    
    // ลบ roleId ออกถ้ามี
    const { roleId, ...requestData } = editFormData;
    console.log('Request body:', requestData);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('Update user response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Update user API response data:', data);
        
        // ดึงข้อมูล user ใหม่จาก API เพื่อให้ได้ roles ที่อัพเดทแล้ว
        try {
          const updatedUserResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users/${editingUser.id}`);
          if (updatedUserResponse.ok) {
            const updatedUserData = await updatedUserResponse.json();
            const updatedUser = updatedUserData.user || updatedUserData;
            console.log('Updated user data from API:', updatedUser);
            
            // Update user in local state with updated roles
            setUsers(prevUsers => prevUsers.map(user => 
              user.id === editingUser.id 
                ? updatedUser
                : user
            ));
            
            console.log('Updated users state');
          }
        } catch (fetchError) {
          console.error('Failed to fetch updated user data:', fetchError);
          // Fallback to basic update
          setUsers(prevUsers => prevUsers.map(user => 
            user.id === editingUser.id 
              ? { ...user, ...requestData }
              : user
          ));
        }
        
        setShowEditModal(false);
        setEditingUser(null);
        setAlert({variant: 'success', title: 'สำเร็จ', message: data.message || 'แก้ไขข้อมูลผู้ใช้งานเรียบร้อยแล้ว'});
      } else {
        const data = await response.json();
        console.log('Update user response not ok:', response.statusText);
        console.log('Update user error response body:', data);
        // Close modal and show alert
        setShowEditModal(false);
        setEditingUser(null);
        setAlert({variant: 'error', title: 'เกิดข้อผิดพลาด', message: data.message || 'ไม่สามารถแก้ไขข้อมูลผู้ใช้งานได้'});
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      // Close modal and show alert
      setShowEditModal(false);
      setEditingUser(null);
      setAlert({variant: 'error', title: 'เกิดข้อผิดพลาด', message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'});
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Users Management" />
      {alert && (
        <div className="mb-4">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
          />
        </div>
      )}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">ตารางแสดงข้อมูลผู้ใช้งานระบบ</h2>
            <Link href="/users/add">
              <Button className="bg-blue-600 hover:bg-blue-700">
                เพิ่มผู้ใช้งาน
              </Button>
            </Link>
          </div>
        </div>
        
        <ComponentCard title={`All Users (${filteredUsers.length})`}>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="ค้นหา username, email, ชื่อ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-11 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full h-11 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
              >
                <option value="all">บทบาททั้งหมด</option>
                {availableRoles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Button
                onClick={handleClearFilters}
                className="w-full h-11 bg-gray-500 hover:bg-gray-600 text-white"
              >
                ล้างค่า
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      ID
                      {sortField === 'id' ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          {sortDirection === 'asc' ? (
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 8l5-5 5 5H5zM5 12l5 5 5-5H5z" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('username')}>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Username
                      {sortField === 'username' ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          {sortDirection === 'asc' ? (
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 8l5-5 5 5H5zM5 12l5 5 5-5H5z" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Name
                      {sortField === 'name' ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          {sortDirection === 'asc' ? (
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 8l5-5 5 5H5zM5 12l5 5 5-5H5z" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('email')}>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                      {sortField === 'email' ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          {sortDirection === 'asc' ? (
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 8l5-5 5 5H5zM5 12l5 5 5-5H5z" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('role')}>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Role
                      {sortField === 'role' ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          {sortDirection === 'asc' ? (
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 8l5-5 5 5H5zM5 12l5 5 5-5H5z" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('isActive')}>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Status
                      {sortField === 'isActive' ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          {sortDirection === 'asc' ? (
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 8l5-5 5 5H5zM5 12l5 5 5-5H5z" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Created
                      {sortField === 'createdAt' ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          {sortDirection === 'asc' ? (
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 8l5-5 5 5H5zM5 12l5 5 5-5H5z" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('updatedAt')}>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Updated
                      {sortField === 'updatedAt' ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          {sortDirection === 'asc' ? (
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 8l5-5 5 5H5zM5 12l5 5 5-5H5z" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{user.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{user.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.roles.length > 0 && user.roles[0].code === 'ADMIN'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {user.roles.length > 0 ? user.roles[0].name : 'No Role'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.updatedAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">OFF</span>
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={user.isActive}
                              onChange={() => handleToggleStatus(user.id)}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                          <span className="text-xs text-gray-500">ON</span>
                        </div>
                        
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          
                          {openDropdown === user.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleEditUser(user);
                                    setOpenDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  แก้ไข
                                </button>
                                <button
                                  onClick={() => {
                                    setDeletingUser(user);
                                    setShowDeleteModal(true);
                                    setOpenDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  ลบ
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
          
          {/* Pagination */}
          {filteredUsers.length > itemsPerPage && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} results
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={filteredTotalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </ComponentCard>
        
        <EditUserModal
          isOpen={showEditModal}
          user={editingUser}
          formData={editFormData}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdateUser}
          onFormChange={setEditFormData}
          loading={editLoading}
          availableRoles={availableRoles}
        />
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">ยืนยันการลบ</h3>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  คุณต้องการลบผู้ใช้งาน <strong>{deletingUser.username}</strong> หรือไม่?
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                <Button 
                  onClick={handleDeleteUser}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5"
                >
                  ลบ
                </Button>
                <Button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2.5"
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}